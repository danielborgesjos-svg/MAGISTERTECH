import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Holozonic Backend running on http://localhost:${PORT}`);
});
