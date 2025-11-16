# Regenerate Android launcher icons with valid PNG format
Add-Type -AssemblyName System.Drawing

$sizes = @{
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

$basePath = "mobile\android\app\src\main\res"

foreach ($density in $sizes.Keys) {
    $size = $sizes[$density]
    $dir = Join-Path $basePath "mipmap-$density"
    
    # Create simple green circle icon
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Enable anti-aliasing
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Fill with transparent background
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    # Draw green circle
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 76, 175, 80))
    $graphics.FillEllipse($brush, 0, 0, $size, $size)
    
    # Draw white inner circle
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $margin = [int]($size * 0.2)
    $graphics.FillEllipse($whiteBrush, $margin, $margin, $size - $margin * 2, $size - $margin * 2)
    
    # Save both launcher icons
    $launcherPath = Join-Path $dir "ic_launcher.png"
    $roundPath = Join-Path $dir "ic_launcher_round.png"
    
    $bitmap.Save($launcherPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Generated icons for $density ($size x $size)"
    
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $whiteBrush.Dispose()
}

Write-Host "All launcher icons regenerated successfully!"
