import * as d3 from "d3";
import * as d3scale from "d3-scale";
import NationsJSON = require("../../static/nations.json");
import React, { FC, useRef, useEffect } from "react";
import styled from "styled-components";
import { useSlide } from "../../hooks";

const StyledSlide = styled.div`
    font-family: "Helvetica Neue", Helvetica, sans-serif;
    height: 100vh;
    display: flex;
    justify-content: center;

    h1 {
        margin: 2.5rem 0;
    }
`;

const StyledChart = styled.div`
    padding: 1rem;
    box-shadow: 0px 5px 16px 0px rgba(0, 0, 0, 0.4);

    text {
        font: 10px sans-serif;
    }

    .dot {
        stroke: #000;
    }

    .axis path,
    .axis line {
        fill: none;
        stroke: #000;
        shape-rendering: crispEdges;
    }

    .label {
        fill: #777;
    }

    .year.label {
        font: 500 196px "Helvetica Neue";
        fill: #ddd;
    }

    .year.label.active {
        fill: #aaa;
    }

    .overlay {
        fill: none;
        pointer-events: all;
        cursor: ew-resize;
    }
`;

function drawChart(elem: HTMLDivElement) {
    // Various accessors that specify the four dimensions of data to visualize.
    function x(d: any) {
        return d.income;
    }
    function y(d: any) {
        return d.lifeExpectancy;
    }
    function radius(d: any) {
        return d.population;
    }
    function color(d: any) {
        return d.region;
    }
    function key(d: any) {
        return d.name;
    }

    // Chart dimensions.
    var margin = { top: 19.5, right: 19.5, bottom: 19.5, left: 39.5 },
        width = 960 - margin.right,
        height = 500 - margin.top - margin.bottom;

    ///////////////////////////////////////////////////////////////////////////////

    // Various scales. These domains make assumptions of data, naturally.
    const xScale = d3scale
            .scaleLog()
            .domain([300, 1e5])
            .range([0, width]),
        yScale = d3scale
            .scaleLinear()
            .domain([10, 85])
            .range([height, 0]),
        radiusScale = d3scale
            .scaleSqrt()
            .domain([0, 5e8])
            .range([0, 40]),
        colorScale = d3scale.scaleOrdinal(d3.schemeCategory10);

    // The x & y axes.
    const xAxis = d3
        .axisBottom(xScale)
        .scale(xScale)
        .ticks(12, d3.format(",d"));

    const yAxis = d3.axisLeft(yScale).scale(yScale);

    // Create the SVG container and set the origin.
    var svg = d3
        .select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the x-axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y-axis.
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Add an x-axis label.
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("income per capita, inflation-adjusted (dollars)");

    // Add a y-axis label.
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("life expectancy (years)");

    // Add the year label; the value is set on transition.
    var label = svg
        .append("text")
        .attr("class", "year label")
        .attr("text-anchor", "end")
        .attr("y", height - 24)
        .attr("x", width)
        .text(1800);

    ///////////////////////////////////////////////////////////////////

    // A bisector since many nation's data is sparsely-defined.
    var bisect = d3.bisector(function(d: any) {
        return d[0];
    });

    // Add a dot per nation. Initialize the data at 1800, and set the colors.
    var dot = svg
        .append("g")
        .attr("class", "dots")
        .selectAll(".dot")
        .data(interpolateData(1800))
        .enter()
        .append("circle")
        .attr("class", "dot")
        .style("fill", function(d) {
            return colorScale(color(d));
        })
        .call(position)
        .sort(order);

    // Add a title.
    dot.append("title").text(function(d: any) {
        return d.name;
    });

    // Add an overlay for the year label.
    var box = label.node()!.getBBox();

    var overlay = svg
        .append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width)
        .attr("height", box.height)
        .on("mouseover", enableInteraction);

    // Start a transition that interpolates the data based on year.
    svg.transition()
        .duration(30000)
        .ease(d3.easeLinear)
        .tween("year", tweenYear)
        .on("end", enableInteraction);

    // Positions the dots based on data.
    function position(dot: any) {
        dot.attr("cx", function(d: any) {
            return xScale(x(d));
        })
            .attr("cy", function(d: any) {
                return yScale(y(d));
            })
            .attr("r", function(d: any) {
                return radiusScale(radius(d));
            });
    }

    // Defines a sort order so that the smallest dots are drawn on top.
    function order(a: any, b: any) {
        return radius(b) - radius(a);
    }

    // After the transition finishes, you can mouseover to change the year.
    function enableInteraction() {
        var yearScale = d3
            .scaleLinear()
            .domain([1800, 2009])
            .range([box.x + 10, box.x + box.width - 10])
            .clamp(true);

        // Cancel the current transition, if any.
        svg.transition().duration(0);

        overlay
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove)
            .on("touchmove", mousemove);

        function mouseover() {
            label.classed("active", true);
        }

        function mouseout() {
            label.classed("active", false);
        }

        function mousemove() {
            displayYear(yearScale.invert(d3.mouse(elem)[0]));
        }
    }

    // Tweens the entire chart by first tweening the year, and then the data.
    // For the interpolated data, the dots and label are redrawn.
    function tweenYear() {
        var year = d3.interpolateNumber(1800, 2009);
        return function(t: any) {
            displayYear(year(t));
        };
    }

    // Updates the display to show the specified year.
    function displayYear(year: any) {
        dot.data(interpolateData(year), key)
            .call(position)
            .sort(order);
        label.text(Math.round(year));
    }

    // Interpolates the dataset for the given (fractional) year.
    function interpolateData(year: any) {
        return NationsJSON.map(function(d: any) {
            return {
                name: d.name,
                region: d.region,
                income: interpolateValues(d.income, year),
                population: interpolateValues(d.population, year),
                lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
            };
        });
    }

    // Finds (and possibly interpolates) the value for the specified year.
    function interpolateValues(values: any, year: any) {
        var i = bisect.left(values, year, 0, values.length - 1),
            a = values[i];
        if (i > 0) {
            var b = values[i - 1],
                t = (year - a[0]) / (b[0] - a[0]);
            return a[1] * (1 - t) + b[1] * t;
        }
        return a[1];
    }
}

export const Slide0: FC = () => {
    useSlide();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            drawChart(ref.current);
        }
    });

    return (
        <StyledSlide>
            <div>
                <h1>Wealth and Health of nations</h1>
                <StyledChart ref={ref} id="chart"></StyledChart>
            </div>
        </StyledSlide>
    );
};
