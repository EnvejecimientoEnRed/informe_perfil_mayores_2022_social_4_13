//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0',
COLOR_ANAG__PRIM_1 = '#BA9D5F', 
COLOR_ANAG_PRIM_2 = '#9E6C51',
COLOR_ANAG_PRIM_3 = '#9E3515',
COLOR_ANAG_COMP_1 = '#1C5A5E';
let tooltip = d3.select('#tooltip');

export function initChart(iframe) {
    //Desarrollo del gráfico
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_social_4_13/main/data/evolucion_tic_2006_2021.csv', function(error,data) {
        if (error) throw error;

        data = data.filter(function(item){if(item['Características demográficas'] != 'Total Personas'){ return item; }});

        ///// Desarrollo del gráfico
        let paths;

        let margin = {top: 10, right: 10, bottom: 30, left: 35},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let sumstat = d3.nest()
            .key(function(d) { return d['Características demográficas'];})
            .entries(data);

        let svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

        // Add X axis
        let x = d3.scaleBand()
            .domain(d3.map(data, function(d) { return d.periodo; }).keys())
            .range([ 0, width ]);
        
        let xAxis = function(svg) {
            svg.call(d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ if(i == 1 || i == 4 || i == 8 || i == 12 || i == 16 || i == data.length - 1){ return d; } })));
            svg.call(function(g){g.selectAll('.tick line').remove()});
            svg.call(function(g){g.select('.domain').remove()});
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add Y axis
        let y = d3.scaleLinear()
            .domain([0, 100])
            .range([ height, 0 ]);
        
        let yAxis = function(svg) {
            svg.call(d3.axisLeft(y).ticks(5).tickFormat(function(d,i) { return numberWithCommas3(d); }));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 0) {
                                return 'line-special';
                            }
                        })
                        .attr('x1', '0%')
                        .attr('x2', `${width}`)
                });
            });
        }

        svg.append("g")
            .attr("class", "yaxis")
            .call(yAxis);

        // color palette
        let res = sumstat.map(function(d){ return d.key; });

        let color = d3.scaleOrdinal()
            .domain(res)
            .range([COLOR_PRIMARY_1, COLOR_ANAG__PRIM_1, COLOR_COMP_2, COLOR_COMP_1, COLOR_ANAG_COMP_1, COLOR_ANAG_PRIM_2, COLOR_ANAG_PRIM_3]); 

        function init() {
            svg.selectAll(".line")
                .data(sumstat)
                .enter()
                .append("path")
                .attr('class', 'rect')
                .attr("fill", "none")
                .attr("stroke", function(d){ return color(d.key) })
                .attr("opacity", 1)
                .attr("stroke-width", 2)
                .attr("d", function(d){
                    return d3.line()
                        .x(function(d) { return x(d.periodo) + x.bandwidth() / 2; })
                        .y(function(d) { return y(+d.Total); })
                        (d.values)
                });

            paths = svg.selectAll('.rect');

            paths.attr("stroke-dasharray", 968 + " " + 968)
                .attr("stroke-dashoffset", 968)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .duration(2000);

            /// Círculos
            svg.selectAll('circles')
                .data(data)
                .enter()
                .append('circle')
                .attr('cx', function(d) {
                    return x(d.periodo) + x.bandwidth() / 2;;
                })
                .attr('cy', function(d) {
                    return y(+d.Total);
                })
                .attr('class', function(d) {
                    return 'circle circle_' + d.periodo;
                })
                .attr('r', 3)
                .attr('stroke', 'none')
                .attr('fill', 'transparent')
                .on('mouseover', function(d,i,e) {
                    //Opacidad en círculos
                    let css = e[i].getAttribute('class').split(' ')[1];
                    let circles = svg.selectAll('.circle');                    
            
                    circles.each(function() {
                        //this.style.stroke = '0.4';
                        let split = this.getAttribute('class').split(" ")[1];
                        if(split == `${css}`) {
                            this.style.stroke = 'black';
                            this.style.strokeWidth = '1';
                        }
                    });

                    //Texto
                    let html = '<p class="chart__tooltip--title">' + d['Características demográficas'] + ' (' + d.periodo + ')</p>' + 
                        '<p class="chart__tooltip--text">El uso de Internet en los últimos tres meses para esta franja de edad es del <b>' + numberWithCommas3(d.Total) + '%</b> en ' + d.periodo +'</p>';
                
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let circles = svg.selectAll('.circle');
                    circles.each(function() {
                        this.style.stroke = 'none';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip);
                });
        }

        function animateChart() {
            paths.attr("stroke-dasharray", 1000 + " " + 1000)
                .attr("stroke-dashoffset", 1000)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .duration(2000);
        }

        /////
        /////
        // Resto - Chart
        /////
        /////
        
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        /////
        /////
        // Resto
        /////
        /////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_social_4_13','uso_internet');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('uso_internet');

        //Captura de pantalla de la visualización
        setChartCanvas();

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('uso_internet');
        });

        //Altura del frame
        setChartHeight(iframe);    
    });    
}