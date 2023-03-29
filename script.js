/* give img Element by id */
const imageUpload = document.getElementById("imageUpload")

/* load different modals we'll use */
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
]).then(start)

/*method start */
async function start() {
  const container = document.createElement("div")
  container.style.position = "relative"
  document.body.append(container)

  const labeledDescriptors = await loadLabelImages()

  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6)
  let image
  let canvas
  document.body.append("Loaded")

  imageUpload.addEventListener("change", async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])
    document.body.append(image)

    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)

    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)

    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors()

    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    const results = resizedDetections.map((detection) =>
      faceMatcher.findBestMatch(detection.descriptor),
    )

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      })
      drawBox.draw(canvas)
    })
  })
}

/* Recognize face */

function loadLabelImages() {
  const labels = [
    "Black Widow",
    "Captain America",
    "Captain Marvel",
    "Hawkeye",
    "Jim Rhodes",
    "Thor",
    "Tony Stark",
  ]
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const image = await faceapi.fetchImage(
          `https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}_${i}.jpg`,
        )
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    }),
  )
}
