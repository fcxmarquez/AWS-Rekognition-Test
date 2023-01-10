import serverless from "serverless-http";
import express from "express";
import AWS from "aws-sdk";
import request from "request";

const app = express();
const requests = request.defaults({ encoding: null });
const rek = new AWS.Rekognition({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

function getImageLabels(params, func) {
  params = {
    img: params.img || params.image || null,
    maxLabels: params.maxLabels || params.MaxLabels || 10,
    minConfidence: params.minConfidence || params.MinConfidence || 80,
  };

  if (!params.img) return func(new Error("No image provided"));
  if (params.img.length <= 8) return func(new Error("Image is too small"));

  requests.get(params.img, (err, _, body) => {
    if (err) return func(new Error("Error in request: " + err));

    const rekParams = {
      Image: { Bytes: body },
      MaxLabels: params.maxLabels,
      MinConfidence: params.minConfidence,
    };

    rek.detectLabels(rekParams, (rekErr, data) => {
      if (rekErr) return func(new Error("Error in rekognition: " + rekErr));

      return func(null, data);
    });
  });
}

app.get("/labels", (req, res) => {
  getImageLabels(req.query, (err, data) => {
    const { query } = req

    if (err) return res.json({ message: err.message, error: true });

    res.json({
      image: query.img || query.image,
      message: "Success",
      data,
    })
  });
});

export default serverless(app)