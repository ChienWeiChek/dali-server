import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Paper, Typography } from '@mui/material';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, send credentials to /api/auth/login
      // const res = await axios.post('/api/auth/login', { username, password });
      
      // For mock scaffold:
      if (username === 'admin' && password === 'password') {
         navigate('/dashboard');
      } else {
         setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Paper className="p-8 w-full max-w-md" elevation={3}>
        <Typography variant="h5" component="h1" className="mb-6 text-center">
          DALI Dashboard
        </Typography>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <TextField
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" size="large">
            Login
          </Button>
        </form>
      </Paper>
    </div>
  );
}
