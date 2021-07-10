export let colorTheme = (number) => {
    var color = (localStorage.color) ? localStorage.color : "blue";

    return {
        text: "text-" + color + "-" + number,
        bg: "bg-" + color + "-" + number,
        scrollbar: "scrollbar-" + color
    }
}