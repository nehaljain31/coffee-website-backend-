const express = require("express");
const router = express.Router();
const Beverage = require("../models/Beverage");


router.post("/", async (req, res) => {
  try {
    const beverage = new Beverage(req.body);
    await beverage.save();
    res.status(201).json(beverage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const beverages = await Beverage.find();
    res.status(200).json(beverages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const beverage = await Beverage.findById(req.params.id);
    if (!beverage) return res.status(404).json({ message: "Beverage not found" });
    res.status(200).json(beverage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const beverage = await Beverage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!beverage) return res.status(404).json({ message: "Beverage not found" });
    res.status(200).json(beverage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const beverage = await Beverage.findByIdAndDelete(req.params.id);
    if (!beverage) return res.status(404).json({ message: "Beverage not found" });
    res.status(200).json({ message: "Beverage deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
