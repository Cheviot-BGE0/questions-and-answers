const express = require('express');
const db = require('./postgres.js');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', async function (req, res) {
  const {product_id, page, count} = req.query
  if (product_id === undefined) {
    return res.status(400).send('missing product ID')
  }
  try {
    const data = await db.getQuestions(product_id, {page, count})
    res.send(data);
  } catch (err) {
    res.status(500).send('unable to retrieve data')
    throw (err)
  }
})

db.init().then(() => {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
})
