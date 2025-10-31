
# SmartSport — Week 2 Starter Pack

This pack adds **male/female** support and a simple data pipeline.
- Edit CSVs in `/data/*_male.csv` and `/data/*_female.csv`
- Run the generator to export dark charts into `/assets/male` and `/assets/female`
- Use the gender toggle in your HTML to switch images and labels

## 1) Add the gender toggle to your topbar
In your HTML (near the top bar), include:
```html
<script src="/js/genderToggle.js" defer></script>
<div class="btn" style="margin-left:12px;">
  Gender:
  <button id="genderToggle" onclick="setGender(localStorage.getItem('smartsport-gender')==='male'?'female':'male')">Male</button>
</div>
```

## 2) Use gender-aware images
Replace your chart images with <img> tags that carry a `data-gender-src` map, e.g.:
```html
<img alt="Rugby Carries" data-gender-src='{
  "male": "/assets/male/rugby_carries_male.png",
  "female": "/assets/female/rugby_carries_female.png"
}' />
```

## 3) Generate charts after editing CSVs
Run the Python script (locally):
```bash
python generate_charts.py
```
It will read the CSVs in `/data/` and overwrite charts in `/assets/male` and `/assets/female`.

## 4) Files in this pack
- /data/rugby_players_male.csv
- /data/rugby_players_female.csv
- /data/loi_standings_male.csv
- /data/loi_standings_female.csv
- /data/gaa_efficiency_male.csv
- /data/gaa_efficiency_female.csv
- /assets/male/*.png (generated)
- /assets/female/*.png (generated)
- /js/genderToggle.js
- /generate_charts.py
```

## Tips
- Keep images the same aspect ratio so the layout doesn't jump when switching.
- The toggle remembers the last choice in `localStorage`.
- You can also change text via `data-gender-text='{"male":"Rugby — Men","female":"Rugby — Women"}'`.
