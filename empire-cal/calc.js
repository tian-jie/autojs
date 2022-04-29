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

auto();

imgToFindPath = "/sdcard/a/empire/tofind.png";
defenseValueAreaImagePath = "/sdcard/a/empire/defenseValueAreaImage.png";
clipTempPath = "/sdcard/a/empire/cliptemp/";

imgToFind = images.read(imgToFindPath);
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

    // 从这个位置往下65像素，截取 320x25，获取血量🩸
    var defenseValueAreaImage = images.clip(fullscreenImg, roomarea.x, roomarea.y+65, 303, 25);
    images.save(defenseValueAreaImage, defenseValueAreaImagePath);

    defenseValueAreaImage.recycle();

    // 2. 分割图片
    // 我们要把图片分割为单个字符, 比如半夜12:18, 我们要把它分割为 半 夜 1 2 : 1 8, 一共7个小图片,
    // 分割图片的详细步骤:
    // 第一步: 提取轮廓

    var defenseValueAreaImage1 = images.read(defenseValueAreaImagePath);
    let imgWidth = defenseValueAreaImage1.getWidth();
    let imgHeight = defenseValueAreaImage1.getHeight();
    let src1 = defenseValueAreaImage1.getMat(); // 大图

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

        //if(contourBox.width<=2 || contourBox.height<2 || contourBox.width > 13 || contourBox.height > 25){
        if(contourBox.width <= 6 || contourBox.width > 15 || contourBox.height<12 || contourBox>25){
            // NOT A COUNTOUR
            continue;
        }

        contourBoxes.push(contourBox);
        //console.log(contourBox);
    }
    // 排序
    contourBoxes = contourBoxes.sort((a, b) => {
        return a.leftTop.x - b.leftTop.x;
    });
    //console.log(contourBoxes);

    // 轮廓有了，根据轮廓重新截图，二值化
    //var binaryImage = com.stardust.autojs.core.image.ImageWrapper.ofMat(binaryMat);
    //console.log(contourBoxes);

    var price = 0;
    contourBoxes.forEach((cb, index, array)=>{
        console.log("Processing a cb - ", index, cb);
        numberClip = images.clip(defenseValueAreaImage1, cb.leftTop.x, cb.leftTop.y, cb.width, cb.height);
        images.save(numberClip, clipTempPath+index+".jpg");
        numberClip.recycle();
        sleep(100);
        numberClip1 = images.read(clipTempPath+index+".jpg");
        // 截取出来的跟之前的对比
        var number = recognizeNumber(numberClip1);
        if(number!= -1){
            price = price * 10 + number;
        }
    });

    defenseValueAreaImage1.recycle();


    // 从这个位置往下65+25+8像素，往右150像素，抓取剩余时间

}

function stop() {
    imgToFind.recycle();
    exit();
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

    var binaryImage = images.matToImage(binary);
    images.save(binaryImage, "/sdcard/a/empire/defenseValueAreaImageBinary.jpg");
    var grayImage = images.matToImage(gray);
    images.save(grayImage, "/sdcard/a/empire/defenseValueAreaImageGray.png");

    Imgproc.findContours(binary, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE, Point());
    //Imgproc.drawContours(image, contours, -1, Scalar(0,0,255,255), 1, 8);
    //console.log(contours);
    // 返回二值化的图片mat
    return binary;
}

// function threshlod(image){
//     let grayMat = new Mat();
//     let binaryMat = new Mat();
//     Imgproc.cvtColor(image, grayMat, Imgproc.COLOR_BGR2GRAY);
//     Imgproc.threshold(grayMat, binaryMat, 0, 10, Imgproc.THRESH_BINARY | Imgproc.THRESH_OTSU);

//     return binaryMat;
// }

function recognizeNumber(numberImageToRecog){
    // for(var m=0; m<10; m++){
    //     numberImg = numbersImages[m];
    //     if(numberImageToRecog.width != numberImg.width || numberImageToRecog.height != numberImg.height){
    //         continue;
    //     }
    //     var p = findImage(numberImg, numberImageToRecog);
    //     if(p){
    //         return m;
    //     }
    // }
    return 1;
}