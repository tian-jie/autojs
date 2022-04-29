runtime.images.initOpenCvIfNeeded();
importClass(org.opencv.core.MatOfByte);
importClass(org.opencv.core.Scalar);
importClass(org.opencv.core.Point);
importClass(org.opencv.core.CvType);
importClass(java.util.List);
importClass(java.util.ArrayList);
importClass(java.util.LinkedList);
importClass(org.opencv.imgproc.Imgproc);
importClass(org.opencv.imgcodecs.Imgcodecs);
importClass(org.opencv.core.Core);
importClass(org.opencv.core.Mat);
importClass(org.opencv.core.MatOfDMatch);
importClass(org.opencv.core.MatOfKeyPoint);
importClass(org.opencv.core.MatOfRect);
importClass(org.opencv.core.Size);
importClass(org.opencv.features2d.DescriptorMatcher);
importClass(org.opencv.features2d.Features2d);
importClass(org.opencv.core.MatOfPoint2f);

auto();
console.log("started");

imgPath = "/sdcard/1.png";

console.log("requesting screenshot");
//Request a screenshot
if(!requestScreenCapture()){
    console.log("Failed to request screenshot");
    toast("Failed to request screenshot");
    exit();
}else{
    console.log("requested screenshot");
}
console.log("requested screenshot");


// 监听音量上下按钮
events.observeKey();
events.on("key", function(keyCode, event){
    if(keyCode == keys.volume_down && event.getAction() == event.ACTION_UP){
        // 音量下键 启动
        start();
    }
    if(keyCode == keys.volume_up && event.getAction() == event.ACTION_UP){
        // 音量下键 启动
        stop();
    }
});
function start(){
    ocrPrice();
}

function stop(){

}


function ocrPrice(){
    console.log("entering ocrPrice");

    // 这是提取时间图片的代码
    var img = captureScreen();
    let priceArea = [920, 297, 1120, 330]; // 左上宽高
    var clip = images.clip(img, priceArea[0], priceArea[1], priceArea[2], priceArea[3]);
    images.save(clip, imgPath);
    $app.viewFile(imgPath);
    clip.recycle();

    // 2. 分割图片
    // 我们要把图片分割为单个字符, 比如半夜12:18, 我们要把它分割为 半 夜 1 2 : 1 8, 一共7个小图片,
    // 分割图片的详细步骤:
    // 第一步: 提取轮廓

    var img = images.read(imgPath);
    let imgWidth = img.getWidth();
    let imgHeight = img.getHeight();
    let src1 = img.getMat(); // 大图

    // 查找轮廓
    let contours = new java.util.ArrayList();
    contour_info(src1, contours);
    let image = contourPainting(img, contourDataArr);
}