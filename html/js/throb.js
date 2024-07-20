function throb(element, minCV, maxCV, frequency, cssProperty, initMin)
{
    let startTime = performance.now();
    let initialCosMultiplier = initMin ? -1 : 1;

    function changeColor()
    {
        let elapsed = (performance.now() - startTime) * frequency;
        let cosValue = initialCosMultiplier * Math.cos(elapsed) / 2 + 0.5;
        let colorValue = minCV + (maxCV - minCV) * cosValue;

        element.style.setProperty(cssProperty, `rgb(${colorValue}, ${colorValue}, ${colorValue})`);

        requestAnimationFrame(changeColor);
    }

    changeColor();
}

export { throb };
