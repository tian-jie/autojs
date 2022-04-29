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

console.log("started");

imgToFind = "/sdcard/a/tofind.png"


// imgPath = "/sdcard/a/tmp.jpg";
// clipTempPath = "/sdcard/a/clipTempPath.jpg";
// priceAreaImageWidth = 200;
// priceAreaImageHeight = 35;

numbersImages = [];
for(i=0; i<10; i++){
    numbersImages[i] = images.read("/sdcard/a/empire/" + i + ".jpg");
}

console.log("requesting screenshot");
//Request a screenshot
if (!requestScreenCapture()) {
    console.log("Failed to request screenshot");
    toast("Failed to request screenshot");
    exit();
} else {
    console.log("requested screenshot");
}
console.log("requested screenshot");


// 监听音量上下按钮
events.observeKey();
events.on("key", function (keyCode, event) {
    if (keyCode == keys.volume_down && event.getAction() == event.ACTION_UP) {
        // 音量下键 启动
        start();
    }
    if (keyCode == keys.volume_up && event.getAction() == event.ACTION_UP) {
        // 音量下键 启动
        stop();
    }
});
function start() {
    //var price = ocrPrice();
    console.log("start to find image location");

    // 找图片
    var fullscreenImg = captureScreen();
    var roomarea = images.findImage(fullscreenImg, imgToFind);
    //var roomarea = findImage(numberImg, numberImageToRecog);
    
    console.log(JSON.stringify(roomarea));
}

function stop() {

}


function ocrPrice() {
    console.log("entering ocrPrice");

    // 这是提取时间图片的代码
    var img = captureScreen();
    let priceArea = [920, 297, priceAreaImageWidth, priceAreaImageHeight]; // 左上宽高
    var clip = images.clip(img, priceArea[0], priceArea[1], priceArea[2], priceArea[3]);

    images.save(clip, imgPath);
    app.viewFile(imgPath);

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
    var binaryMat = contour_info(src1, contours);
    console.log("contours.size(): ", contours.size());

    var contourBoxes = [];
    //images.save(src1, imgPath);
    for (var i = 0; i < contours.size(); i++) {
        console.log("contours: ", i);
        var points = contours.get(i).toArray();
        //console.log(points);
        // 轮廓最小外接矩形
        minX = 99999;
        minY = 99999;
        maxX = 0;
        maxY = 0;
        points.forEach((p, index, points) => {
            if (p.x < minX) {
                minX = p.x;
            }
            if (p.y < minY) {
                minY = p.y;
            }
            if (p.x > maxX) {
                maxX = p.x;
            }
            if (p.y > maxY) {
                maxY = p.y;
            }
        });


        var contourBox = {
            leftTop: {
                x: minX,
                y: minY
            },
            rightBottom: {
                x: maxX,
                y: maxY
            },
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };


        contourBoxes.push(contourBox);

    }
    // 排序
    contourBoxes = contourBoxes.sort((a, b) => {
        return a.leftTop.x - b.leftTop.x;
    });
    console.log(contourBoxes);

    // 轮廓有了，根据轮廓重新截图，二值化
    //var binaryImage = com.stardust.autojs.core.image.ImageWrapper.ofMat(binaryMat);
    
    var price = 0;
    contourBoxes.forEach((cb, index, array)=>{
        numberClip = images.clip(clip, cb.leftTop.x, cb.leftTop.y, cb.width, cb.height);
        images.save(numberClip, clipTempPath);
        sleep(100);
        numberClip = images.read(clipTempPath);
        // 截取出来的跟之前的对比
        var number = recognizeNumber(numberClip);
        if(number!= -1){
            price = price * 10 + number;
        }
    });

    clip.recycle();

    img.recycle();

    return price;
}

// ===================自定义函数=====================
function contour_info(image, contours) {
    let dst = new Mat();
    //Imgproc.GaussianBlur(image, dst, Size(3, 3), 0);
    let gray = new Mat();
    let binary = new Mat();
    Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY);
    Imgproc.threshold(gray, binary, 0, 10, Imgproc.THRESH_BINARY | Imgproc.THRESH_OTSU);
    let hierarchy = new Mat();
    Imgproc.findContours(binary, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE, Point());
    //Imgproc.drawContours(image, contours, -1, Scalar(0,0,255,255), 1, 8);
    //console.log(contours);
    // 返回二值化的图片mat
    return binary;
}

function threshlod(image){
    let grayMat = new Mat();
    let binaryMat = new Mat();
    Imgproc.cvtColor(image, grayMat, Imgproc.COLOR_BGR2GRAY);
    Imgproc.threshold(grayMat, binaryMat, 0, 10, Imgproc.THRESH_BINARY | Imgproc.THRESH_OTSU);

    return binaryMat;
}

function recognizeNumber(numberImageToRecog){
    for(var m=0; m<10; m++){
        numberImg = numbersImages[m];
        if(numberImageToRecog.width != numberImg.width || numberImageToRecog.height != numberImg.height){
            continue;
        }
        var p = findImage(numberImg, numberImageToRecog);
        if(p){
            return m;
        }
        // diff = 0;
        // for(var i=0; i<numberImageToRecog.width; i++){
        //     for(var j=0; j<numberImageToRecog.height; j++){
        //         pix1 = images.pixel(numberImageToRecog, i, j);
        //         pix2 = images.pixel(numberImg, i, j);
        //         //diff += (pix1.red - pix2.red)*(pix1.red - pix2.red) + (pix1.blue - pix2.blue)*(pix1.blue - pix2.blue) + (pix1.green - pix2.green)*(pix1.green - pix2.green);
        //         diff == (pix1-pix2)*(pix1-pix2);
        //     }
        // }
        // if(diff > 10000){
        //     continue;
        // }
    }
    return -1;
}