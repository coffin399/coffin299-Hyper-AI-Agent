import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  LinearProgress,
} from '@mui/material';

interface WeatherData {
  city: string;
  temperature: number;
  description: string;
}

interface TaskStats {
  total: number;
  completed: number;
}

const DEFAULT_COORDS = {
  latitude: 35.6895,
  longitude: 139.6917,
  city: 'Tokyo',
};

const OverviewDashboard: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [taskStats] = useState<TaskStats>({ total: 12, completed: 9 });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, fallbackCity?: string) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.current_weather) return;
        const temp = data.current_weather.temperature;
        const code = data.current_weather.weathercode as number | undefined;
        const description = code === undefined ? 'Clear' : 'Clear';
        setWeather({
          city: fallbackCity || DEFAULT_COORDS.city,
          temperature: temp,
          description,
        });
      } catch {
        setWeather({
          city: DEFAULT_COORDS.city,
          temperature: 22,
          description: 'Clear',
        });
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fetchWeather(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude, DEFAULT_COORDS.city);
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude, DEFAULT_COORDS.city);
    }
  }, []);

  const completionRate = useMemo(() => {
    if (!taskStats.total) return 0;
    return Math.round((taskStats.completed / taskStats.total) * 100);
  }, [taskStats]);

  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysMatrix = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows: (number | null)[][] = [];
    let currentDay = 1 - firstDay;
    for (let week = 0; week < 6; week++) {
      const row: (number | null)[] = [];
      for (let d = 0; d < 7; d++) {
        if (currentDay < 1 || currentDay > daysInMonth) {
          row.push(null);
        } else {
          row.push(currentDay);
        }
        currentDay++;
      }
      rows.push(row);
    }
    return rows;
  }, [year, month]);

  const todayDate = today.getDate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#050509',
        color: 'rgba(255,255,255,0.9)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Overview
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.6)">
            今日の進捗とコンディションを一目でチェック
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              height: '100%',
              bgcolor: 'rgba(16,16,24,0.95)',
              borderRadius: 3,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <CardContent sx={{ p: 0, mb: 2 }}>
              <Typography variant="subtitle2" color="primary.main" gutterBottom>
                Fresh start
              </Typography>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                今日を有意義に使いましょう
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.6)">
                集中する時間を確保し、タスクを着実に完了させましょう。
              </Typography>
            </CardContent>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 2, gap: 3 }}>
              <Box>
                <Typography variant="h2" fontWeight={700}>
                  {now.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.6)">
                  {now.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" fontWeight={700}>
                  {weather ? `${Math.round(weather.temperature)}°C` : '--°C'}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.6)">
                  {weather ? weather.description : 'Loading weather...'}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.6)">
                  {weather ? weather.city : DEFAULT_COORDS.city}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
              bgcolor: 'rgba(16,16,24,0.95)',
              borderRadius: 3,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="subtitle2" color="primary.main" gutterBottom>
              Task Completion
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
              <CircularProgress
                variant="determinate"
                value={completionRate}
                size={120}
                thickness={4}
                sx={{ color: 'primary.main' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h4" component="div" color="white">
                  {`${completionRate}%`}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="rgba(255,255,255,0.6)">
              {taskStats.completed} / {taskStats.total} tasks 完了
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: 'rgba(16,16,24,0.95)',
              borderRadius: 3,
              p: 3,
              height: '100%',
            }}
          >
            <Typography variant="subtitle2" color="primary.main" gutterBottom>
              今日のタスク
            </Typography>
            <Typography variant="body1" gutterBottom>
              集中タスク
            </Typography>
            <LinearProgress
              variant="determinate"
              value={completionRate}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 2,
              }}
            />
            <Typography variant="body2" color="rgba(255,255,255,0.6)">
              今日は {taskStats.total} 件中 {taskStats.completed} 件を完了しています。
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: 'rgba(16,16,24,0.95)',
              borderRadius: 3,
              p: 3,
              height: '100%',
            }}
          >
            <Typography variant="subtitle2" color="primary.main" gutterBottom>
              カレンダー
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.6)" gutterBottom>
              {year}年 {month + 1}月
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mt: 1 }}>
              {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
                <Typography
                  key={d}
                  variant="caption"
                  sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}
                >
                  {d}
                </Typography>
              ))}
              {daysMatrix.map((week, i) =>
                week.map((day, j) => {
                  const isToday = day === todayDate;
                  return (
                    <Box
                      key={`${i}-${j}`}
                      sx={{
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 2,
                        bgcolor: isToday ? 'primary.main' : 'transparent',
                        color: isToday ? 'primary.contrastText' : 'rgba(255,255,255,0.8)',
                        opacity: day ? 1 : 0.15,
                      }}
                    >
                      <Typography variant="caption">{day ?? ''}</Typography>
                    </Box>
                  );
                })
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewDashboard;
