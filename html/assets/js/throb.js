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

let body = document.body;
let element = document.documentElement;

// Background
throb(body, 240, 255, 0.001, '--background-color', false);
// Button
throb(element, 255, 240, .005, '--button-color-active', false);
// Link
throb(element, 100, 160, .005, '--link-color-active', true);
throb(element, 60, 120, .002, '--link-color-passive', true);
