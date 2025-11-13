from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Google APIスコープ
SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/presentations',
]


class GoogleService:
    """Google API連携サービス"""

    def __init__(self) -> None:
        self.credentials_dir = Path(settings.data_dir) / "credentials"
        self.credentials_dir.mkdir(parents=True, exist_ok=True)
        self.token_file = self.credentials_dir / "google_token.json"
        self.credentials_file = self.credentials_dir / "google_credentials.json"

    def setup_credentials(self, client_config: Dict[str, Any]) -> str:
        """OAuth認証URLを生成"""
        flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
        auth_url, _ = flow.authorization_url(prompt='consent')
        return auth_url

    def exchange_code(self, client_config: Dict[str, Any], code: str) -> bool:
        """認証コードをトークンに交換"""
        try:
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # トークンを保存
            with open(self.token_file, 'w') as token:
                token.write(credentials.to_json())
            
            return True
        except Exception as e:
            logger.error(f"Failed to exchange code: {e}")
            return False

    def get_credentials(self) -> Optional[Credentials]:
        """保存された認証情報を取得"""
        if not self.token_file.exists():
            return None
            
        try:
            creds = Credentials.from_authorized_user_file(str(self.token_file), SCOPES)
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                with open(self.token_file, 'w') as token:
                    token.write(creds.to_json())
            return creds
        except Exception as e:
            logger.error(f"Failed to get credentials: {e}")
            return None

    def is_authenticated(self) -> bool:
        """認証済みかチェック"""
        return self.get_credentials() is not None

    def revoke_credentials(self) -> bool:
        """認証情報を削除"""
        try:
            if self.token_file.exists():
                self.token_file.unlink()
            return True
        except Exception as e:
            logger.error(f"Failed to revoke credentials: {e}")
            return False

    async def get_drive_files(self, query: str = "", page_size: int = 10) -> List[Dict]:
        """Google Driveファイル一覧を取得"""
        creds = self.get_credentials()
        if not creds:
            raise ValueError("Not authenticated")

        try:
            service = build('drive', 'v3', credentials=creds)
            
            # クエリ構築
            q = "trashed=false"
            if query:
                q += f" and name contains '{query}'"
            
            results = service.files().list(
                q=q,
                pageSize=page_size,
                fields="files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)"
            ).execute()
            
            return results.get('files', [])
        except HttpError as e:
            logger.error(f"Drive API error: {e}")
            raise

    async def create_document(self, title: str, content: str = "") -> Dict:
        """Google Docsを作成"""
        creds = self.get_credentials()
        if not creds:
            raise ValueError("Not authenticated")

        try:
            service = build('docs', 'v1', credentials=creds)
            
            doc = service.documents().create(body={'title': title}).execute()
            
            if content:
                # コンテントを挿入
                requests = [
                    {
                        'insertText': {
                            'location': {
                                'index': 1,
                            },
                            'text': content
                        }
                    }
                ]
                service.documents().batchUpdate(
                    documentId=doc['documentId'],
                    body={'requests': requests}
                ).execute()
            
            return doc
        except HttpError as e:
            logger.error(f"Docs API error: {e}")
            raise

    async def create_spreadsheet(self, title: str, rows: List[List[str]] = None) -> Dict:
        """Google Sheetsを作成"""
        creds = self.get_credentials()
        if not creds:
            raise ValueError("Not authenticated")

        try:
            service = build('sheets', 'v4', credentials=creds)
            
            spreadsheet = {
                'properties': {
                    'title': title
                }
            }
            
            sheet = service.spreadsheets().create(body=spreadsheet).execute()
            
            if rows:
                # データを挿入
                range_name = 'Sheet1!A1'
                body = {
                    'values': rows
                }
                service.spreadsheets().values().update(
                    spreadsheetId=sheet['spreadsheetId'],
                    range=range_name,
                    valueInputOption='USER_ENTERED',
                    body=body
                ).execute()
            
            return sheet
        except HttpError as e:
            logger.error(f"Sheets API error: {e}")
            raise

    async def create_presentation(self, title: str, slides_data: List[Dict] = None) -> Dict:
        """Google Slidesを作成"""
        creds = self.get_credentials()
        if not creds:
            raise ValueError("Not authenticated")

        try:
            service = build('slides', 'v1', credentials=creds)
            
            presentation = {
                'title': title
            }
            
            deck = service.presentations().create(body=presentation).execute()
            
            if slides_data:
                # スライドを追加
                requests = []
                for slide_data in slides_data:
                    requests.append({
                        'createSlide': {
                            'objectId': f'slide_{len(requests) + 1}',
                            'insertionIndex': len(requests) + 1,
                            'slideLayoutReference': {
                                'predefinedLayout': 'TITLE_AND_BODY'
                            }
                        }
                    })
                
                if requests:
                    service.presentations().batchUpdate(
                        presentationId=deck['presentationId'],
                        body={'requests': requests}
                    ).execute()
            
            return deck
        except HttpError as e:
            logger.error(f"Slides API error: {e}")
            raise

    async def get_document_content(self, document_id: str) -> str:
        """Google Docsの内容を取得"""
        creds = self.get_credentials()
        if not creds:
            raise ValueError("Not authenticated")

        try:
            service = build('docs', 'v1', credentials=creds)
            
            doc = service.documents().get(documentId=document_id).execute()
            
            content = ""
            for element in doc.get('body').get('content'):
                if 'paragraph' in element:
                    for paragraph_element in element.get('paragraph').get('elements'):
                        if 'textRun' in paragraph_element:
                            content += paragraph_element.get('textRun').get('content')
            
            return content
        except HttpError as e:
            logger.error(f"Docs API error: {e}")
            raise

    async def get_spreadsheet_values(self, spreadsheet_id: str, range_name: str = 'Sheet1!A:Z') -> List[List[str]]:
        """Google Sheetsの値を取得"""
        creds = self.get_credentials()
        if not creds:
            raise ValueError("Not authenticated")

        try:
            service = build('sheets', 'v4', credentials=creds)
            
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=range_name
            ).execute()
            
            return result.get('values', [])
        except HttpError as e:
            logger.error(f"Sheets API error: {e}")
            raise


google_service = GoogleService()
