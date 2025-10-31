
import pandas as pd, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE = os.path.dirname(__file__)
DATA = os.path.join(BASE, "data")
ASSETS_M = os.path.join(BASE, "assets", "male")
ASSETS_F = os.path.join(BASE, "assets", "female")

BG="#0f1115"; AX="#171a21"; FG="#e9edf1"; MUTED="#a5adba"

def fm_axes(ax, title=None):
    ax.set_facecolor(AX); ax.figure.set_facecolor(BG)
    ax.tick_params(colors=FG, labelsize=9)
    for s in ax.spines.values(): s.set_color("#262b36")
    ax.grid(True, color="#242a33", linewidth=0.6, alpha=0.6)
    if title: ax.set_title(title, color=FG, fontsize=11, pad=8, weight="bold")
    ax.yaxis.label.set_color(MUTED); ax.xaxis.label.set_color(MUTED)

def save_rugby(df, outdir, label):
    import numpy as np, os
    for col in ["Carries","Metres","Tackles","Turnovers"]:
        fig, ax = plt.subplots(figsize=(6,3.4))
        fm_axes(ax, f"Rugby — {col} ({label})")
        x = np.arange(len(df)); ax.bar(x, df[col].values)
        ax.set_xticks(x, df["Player"].values, rotation=15, ha="right"); ax.set_ylabel(col)
        fig.tight_layout(); fig.savefig(os.path.join(outdir, f"rugby_{col.lower()}_{label}.png"), dpi=180); plt.close(fig)

def save_loi(df, outdir, label):
    import numpy as np, os
    fig, ax = plt.subplots(figsize=(6,3.4))
    fm_axes(ax, f"League — Points vs Form ({label})")
    x = np.arange(len(df)); w=0.38
    ax.bar(x-w/2, df["Pts"].values, width=w); ax.bar(x+w/2, df["FormPts"].values, width=w)
    ax.set_xticks(x, df["Team"].values, rotation=15, ha="right"); ax.set_ylabel("Pts / PPG")
    fig.tight_layout(); fig.savefig(os.path.join(outdir, f"loi_points_form_{label}.png"), dpi=180); plt.close(fig)

def save_gaa(df, outdir, label):
    import os
    fig, ax = plt.subplots(figsize=(6,3.4))
    fm_axes(ax, f"GAA — Shot Efficiency (%) ({label})")
    ax.plot(df["Season"], df["Dublin"], marker="o")
    if "Kerry" in df.columns: ax.plot(df["Season"], df["Kerry"], marker="o")
    if "Galway" in df.columns: ax.plot(df["Season"], df["Galway"], marker="o")
    ax.set_xlabel("Season"); ax.set_ylabel("Shot Efficiency %")
    leg = ax.legend([c for c in df.columns if c!="Season"])
    for t in leg.get_texts(): t.set_color(FG)
    leg.get_frame().set_facecolor(AX); leg.get_frame().set_edgecolor("#262b36")
    fig.tight_layout(); fig.savefig(os.path.join(outdir, f"gaa_eff_{label}.png"), dpi=180); plt.close(fig)

def main():
    # Create dirs
    os.makedirs(ASSETS_M, exist_ok=True); os.makedirs(ASSETS_F, exist_ok=True)
    # Load CSVs
    rm = pd.read_csv(os.path.join(DATA,"rugby_players_male.csv"))
    rf = pd.read_csv(os.path.join(DATA,"rugby_players_female.csv"))
    lm = pd.read_csv(os.path.join(DATA,"loi_standings_male.csv"))
    lf = pd.read_csv(os.path.join(DATA,"loi_standings_female.csv"))
    gm = pd.read_csv(os.path.join(DATA,"gaa_efficiency_male.csv"))
    gf = pd.read_csv(os.path.join(DATA,"gaa_efficiency_female.csv"))

    save_rugby(rm, ASSETS_M, "male"); save_rugby(rf, ASSETS_F, "female")
    save_loi(lm, ASSETS_M, "male"); save_loi(lf, ASSETS_F, "female")
    save_gaa(gm, ASSETS_M, "male"); save_gaa(gf, ASSETS_F, "female")
    print("Charts generated in /assets/male and /assets/female")

if __name__ == "__main__":
    main()
