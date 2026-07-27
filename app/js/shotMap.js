let currentShots = [];

function drawShotMap(shots) {

    currentShots = shots;

    const container = document.getElementById("shotMap");

    if (!container) return;

    container.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");

    svg.setAttribute("viewBox","0 0 600 420");
    svg.style.width="100%";
    svg.style.height="100%";

    /* Pitch */

    svg.innerHTML = `

    <rect
        x="0"
        y="0"
        width="600"
        height="420"
        fill="#153E2A"
        rx="18"/>

    <line
        x1="300"
        y1="0"
        x2="300"
        y2="420"
        stroke="#ffffff"
        stroke-width="2"/>

    <circle
        cx="300"
        cy="210"
        r="70"
        stroke="white"
        stroke-width="2"
        fill="none"/>

    <rect
        x="0"
        y="120"
        width="90"
        height="180"
        stroke="white"
        stroke-width="2"
        fill="none"/>

    <rect
        x="510"
        y="120"
        width="90"
        height="180"
        stroke="white"
        stroke-width="2"
        fill="none"/>

    `;
	
	    shots.forEach(shot=>{

        const circle=document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.setAttribute("cx",shot.x);
        circle.setAttribute("cy",shot.y);

        circle.setAttribute("r",8);

        switch(shot.result){

            case "Goal":
                circle.setAttribute("fill","#10B981");
                break;

            case "Point":
                circle.setAttribute("fill","#3B82F6");
                break;

            case "Wide":
                circle.setAttribute("fill","#EF4444");
                break;

            case "Saved":
                circle.setAttribute("fill","#F59E0B");
                break;

            default:
                circle.setAttribute("fill","#94A3B8");

        }

        circle.style.cursor="pointer";

        circle.addEventListener("mouseenter",()=>{

            showShotTooltip(shot);

        });

        svg.appendChild(circle);

    });

    container.appendChild(svg);

}

function showShotTooltip(shot){

    console.log(shot);

}