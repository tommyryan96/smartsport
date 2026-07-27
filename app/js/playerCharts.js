let passingChart = null;
let performanceChart = null;

/* -----------------------------
   Passing Accuracy Doughnut
------------------------------*/

function drawPassingChart(player) {

    const ctx = document.getElementById("passingChart");

    if (!ctx) return;

    if (passingChart) {
        passingChart.destroy();
    }

    passingChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: ["Completed", "Incomplete"],

            datasets: [{
                data: [
                    player.passing,
                    100 - player.passing
                ],
                backgroundColor: [
                    "#10B981",
                    "#1E293B"
                ],
                borderWidth: 0
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "72%",

            plugins: {

                legend: {

                    display: false

                },

                tooltip: {

                    callbacks: {

                        label: function(context){

                            return context.raw + "%";

                        }

                    }

                }

            }

        }

    });

}

/* -----------------------------
   Performance Over Time
------------------------------*/

function drawPerformanceChart(player){

    const ctx = document.getElementById("performanceChart");

    if(!ctx) return;

    if(performanceChart){

        performanceChart.destroy();

    }

    performanceChart = new Chart(ctx,{

        type:"line",

        data:{

            labels:[
                "Match 1",
                "Match 2",
                "Match 3",
                "Match 4",
                "Match 5",
                "Match 6"
            ],

            datasets:[{

                label:"Performance Rating",

                data:player.performance,

                borderColor:"#10B981",

                backgroundColor:"rgba(16,185,129,.15)",

                borderWidth:4,

                tension:.35,

                fill:true,

                pointRadius:5,

                pointBackgroundColor:"#10B981"

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            scales:{

                y:{

                    min:0,

                    max:10,

                    ticks:{

                        color:"#94A3B8"

                    },

                    grid:{

                        color:"#1E293B"

                    }

                },

                x:{

                    ticks:{

                        color:"#94A3B8"

                    },

                    grid:{

                        display:false

                    }

                }

            },

            plugins:{

                legend:{

                    display:false

                }

            }

        }

    });

}