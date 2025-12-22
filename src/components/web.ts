import express from 'express';

export function web() {
  const app = express();
  // const PORT = process.env.PORT || 3000;
  const PORT = 3000;

  app.get('/', (req, res) => {
    res.send('羽毛botは正常に動作しています。');
  });

  app.listen(PORT, () => {
    console.log(`Web server is running on port ${PORT}`);
  });
}