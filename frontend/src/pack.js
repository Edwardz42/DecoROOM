const pack = document.getElementById("pack");
const wrapper = document.querySelector(".pack-wrapper");

if(pack && wrapper){

wrapper.addEventListener("mousemove", (e) => {

    const rect = wrapper.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -(mouseY - centerY) / 12;
    const rotateY = (mouseX - centerX) / 12;

    pack.style.transform =
        `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

});

wrapper.addEventListener("mouseleave", () => {

    pack.style.transform =
        "rotateX(0deg) rotateY(0deg)";

});

wrapper.addEventListener("mouseenter", () => {

    pack.style.transition =
        "transform 0.05s";

});

}