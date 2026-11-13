"""Scaled shot maps for the sample reports.

The pitch is drawn to scale: full length 140 m x 76 m wide, goal on the right.
Shots are given in metres: (distance out from the goal line, distance across from the
centre line of the pitch, kind). The 2-point arc is 40 m from the centre of the goal,
so points sit inside it and 2-pointers outside, as in the real game.
"""
import math

ARC_M = 40


def pitch(w, h, shots, length_m=140, width_m=76):
    sx, sy = w / length_m, h / width_m
    gx, gy = w - 6, h / 2  # centre of the goal, on the right-hand end line

    def line(m):
        x = gx - m * sx
        return f'<line x1="{x:.1f}" y1="4" x2="{x:.1f}" y2="{h-4}"/>'

    r = ARC_M * sx
    svg = [f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shot map" '
           f'style="width:100%;display:block;border-radius:14px;background:#1B5E3B">',
           f'<defs><clipPath id="pitch{w}"><rect x="4" y="4" width="{w-8}" height="{h-8}" rx="6"/></clipPath></defs>',
           '<g fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2">',
           f'<rect x="4" y="4" width="{w-8}" height="{h-8}" rx="6"/>',
           line(13), line(20), line(45), line(length_m / 2),
           f'<rect x="{gx - 4.5*sx:.1f}" y="{gy - 5*sy:.1f}" width="{4.5*sx:.1f}" height="{10*sy:.1f}"/>',
           f'<circle cx="{gx:.1f}" cy="{gy:.1f}" r="{r:.1f}" stroke-dasharray="7 6" clip-path="url(#pitch{w})"/>',
           '</g>']
    k = max(w / 700, 0.45)  # marker scale
    for dist, across, kind in shots:
        x, y = gx - dist * sx, gy + across * sy
        d = math.hypot(dist, across)
        assert kind != "point" or d < ARC_M, f"point outside arc at {d:.1f} m"
        assert kind != "two" or d > ARC_M, f"2-pointer inside arc at {d:.1f} m"
        if kind == "point":
            svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{8*k:.1f}" fill="#fff"/>')
        elif kind == "two":
            svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{10*k:.1f}" fill="#E7AE72"/>')
        elif kind == "goal":
            s = 18 * k
            svg.append(f'<rect x="{x-s/2:.1f}" y="{y-s/2:.1f}" width="{s:.1f}" height="{s:.1f}" rx="3" fill="#C9772B" stroke="#fff" stroke-width="2"/>')
        else:
            svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{7*k:.1f}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="{2.5*k:.1f}"/>')
    svg.append("</svg>")
    return "".join(svg)


# Demo match: 12 points, 2 two-pointers, 1 goal, 6 wides (4 of them from outside 40 m) -> 1-16 from 21 shots
TEAM = [(14, -6, "point"), (18, 4, "point"), (22, -10, "point"), (25, 8, "point"), (12, 10, "point"),
        (28, -3, "point"), (20, 14, "point"), (31, 5, "point"), (16, -16, "point"), (26, -18, "point"),
        (33, -9, "point"), (24, 20, "point"),
        (42, -12, "two"), (44, 10, "two"),
        (8, 2, "goal"),
        (45, -22, "wide"), (47, 14, "wide"), (43, 24, "wide"), (46, -4, "wide"), (21, -25, "wide"), (30, 24, "wide")]

# Demo player: 3 points, 1 two-pointer, 2 wides from range -> 0-05 from 6 shots
PLAYER = [(17, -5, "point"), (24, 9, "point"), (29, -12, "point"),
          (43, 7, "two"),
          (46, -15, "wide"), (44, 20, "wide")]

LEGEND_ITEMS = [("point", "Point"), ("two", "2-pointer"), ("goal", "Goal"), ("wide", "Wide")]


def legend():
    def marker(kind):
        if kind == "point":
            m = '<circle cx="10" cy="10" r="5" fill="#fff"/>'
        elif kind == "two":
            m = '<circle cx="10" cy="10" r="6" fill="#E7AE72"/>'
        elif kind == "goal":
            m = '<rect x="4.5" y="4.5" width="11" height="11" rx="2" fill="#C9772B" stroke="#fff" stroke-width="1.5"/>'
        else:
            m = '<circle cx="10" cy="10" r="4.5" fill="none" stroke="#fff" stroke-width="2"/>'
        return f'<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect width="20" height="20" rx="5" fill="#1B5E3B"/>{m}</svg>'
    items = "".join(f'<span class="flex items-center gap-1.5">{marker(k)}{label}</span>' for k, label in LEGEND_ITEMS)
    return f'<div class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 mt-3">{items}<span class="text-slate-400">Dashed line: 40 m arc</span></div>'
