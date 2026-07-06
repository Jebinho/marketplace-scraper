# Global Marketplace Scraper

A high-performance web scraper built with **Node.js, Crawlee, and Playwright**, specifically designed to run on the [Apify](https://apify.com/) platform. It extracts product data from the world's largest e-commerce marketplaces using a single unified interface.

## 🚀 Supported Platforms

- **Mercado Livre** (Brazil / LATAM)
- **Amazon** (Global)
- **Shopee** (Brazil / Global)
- **AliExpress** (Global)
- **eBay** (Global)
- **Walmart** (Global)

## 📦 Extracted Data

The scraper exports data in a standardized JSON/CSV format. For each product, it attempts to extract:
- Product Name
- Price
- Currency
- URL
- Image URL
- Rating (Stars)
- Number of Reviews
- Source Platform

*(Note: Data availability depends on the specific marketplace and its current frontend architecture).*

## ⚙️ Usage on Apify

1. **Deploy to Apify**: Push this repository to your Apify Actor.
2. **Configure Input**: In the Apify Console, go to the **Input** tab.
3. **Search Terms**: Add one or more keywords (e.g., `iphone 15`, `mechanical keyboard`).
4. **Select Platforms**: Toggle the switches (ON/OFF) for the marketplaces you want to scrape.
5. **Max Items**: Set the maximum number of products to scrape per platform for each keyword.
6. **Proxies (Highly Recommended)**: Under "Proxy Configuration", ensure Apify Proxies (preferably Residential) are enabled to bypass anti-bot systems like captchas.
7. **Run**: Click **Start** and download your dataset once it's finished!

## 💻 Local Development

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   npx playwright install
   ```
3. Edit the input configuration in `storage/key_value_stores/default/INPUT.json`.
4. Run the scraper:
   ```bash
   npm start
   ```
5. Find the output data in `storage/datasets/default/`.

## 🛠️ Built With
- [Crawlee](https://crawlee.dev/)
- [Playwright](https://playwright.dev/)
- [Apify SDK](https://docs.apify.com/sdk/js)
