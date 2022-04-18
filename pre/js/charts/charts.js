//Desarrollo de las visualizaciones
import * as d3 from 'd3';
//import { numberWithCommas2 } from './helpers';
//import { getInTooltip, getOutTooltip, positionTooltip } from './modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C', 
COLOR_PRIMARY_2 = '#E37A42', 
COLOR_ANAG_1 = '#D1834F', 
COLOR_ANAG_2 = '#BF2727', 
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0', 
COLOR_GREY_1 = '#B5ABA4', 
COLOR_GREY_2 = '#64605A', 
COLOR_OTHER_1 = '#B58753', 
COLOR_OTHER_2 = '#731854';

export function initChart(iframe) {
    //Desarrollo del gráfico
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_social_4_13/main/data/evolucion_tic_2006_2021.csv', function(error,data) {
        if (error) throw error;

        data = data.filter(function(item){if(item['Características demográficas'] != 'Total Personas'){ return item; }});

        ///// Desarrollo de los tres gráficos
        let currentEdad = '65_74';

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
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add Y axis
        let y = d3.scaleLinear()
            .domain([0, 100])
            .range([ height, 0 ]);
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5));

        // color palette
        let res = sumstat.map(function(d){ return d.key; });

        let color = d3.scaleOrdinal()
            .domain(res)
            .range([COLOR_PRIMARY_1, COLOR_COMP_2, COLOR_COMP_1, COLOR_GREY_1, COLOR_GREY_2, COLOR_OTHER_1, COLOR_OTHER_2]); 

        function init() {
            svg.selectAll(".line")
                .data(sumstat)
                .enter()
                .append("path")
                .attr('class', 'lines')
                .attr("fill", "none")
                .attr("stroke", function(d){ return color(d.key) })
                .attr("opacity", function(d) {
                    if(d.key == 'De 65 a 74 años') {
                        return '1';
                    } else {
                        return '0.35';
                    }
                })
                .attr("stroke-width", function(d) {
                    if(d.key == 'De 65 a 74 años') {
                        return '3';
                    } else {
                        return '1.5';
                    }
                })
                .attr("d", function(d){
                    return d3.line()
                        .x(function(d) { return x(d.periodo) + x.bandwidth() / 2; })
                        .y(function(d) { return y(+d.Total); })
                        (d.values)
                });
        }

        function animateChart() {

        }

        function setChart(edad) {
            svg.selectAll(".lines")
                .attr("fill", "none")
                .attr("stroke", function(d){ return color(d.key) })
                .attr("opacity", function(d) {
                    if(d.key == edad) {
                        return '1';
                    } else {
                        return '0.35';
                    }
                })
                .attr("stroke-width", function(d) {
                    if(d.key == edad) {
                        return '3';
                    } else {
                        return '1.5';
                    }
                })
                .attr("d", function(d){
                    return d3.line()
                        .x(function(d) { return x(d.periodo) + x.bandwidth() / 2; })
                        .y(function(d) { return y(+d.Total); })
                        (d.values)
                });
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

        document.getElementById('viz_edad').addEventListener('change', function(e) {
            if(currentEdad != e.target.value) {
                currentEdad = e.target.value;
                setChart(currentEdad);
            }            
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