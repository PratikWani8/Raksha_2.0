import { useEffect, useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

import VideoCard from "../components/VideoCard"
import CoursePlayer from "../components/CoursePlayer"
import ProgressBar from "../components/ProgressBar"
import Certificate from "../components/Certificate"

const CoursePage = () => {
  const [videos, setVideos] = useState([])
  const [currentVideo, setCurrentVideo] = useState(null)
  const [completed, setCompleted] = useState([])
  const [username, setUsername] = useState("")
  const [showCertificate, setShowCertificate] = useState(false)
  const [rating, setRating] = useState(0)

  const userId = localStorage.getItem("userId")

  // FETCH VIDEOS
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/videos")
        setVideos(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchVideos()
  }, [])

  // FETCH USER
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!userId) return

        const res = await axios.get(
          `http://localhost:5000/api/users/${userId}`
        )

        setUsername(res.data.name)
      } catch (err) {
        console.error(err)
        setUsername("Guest User")
      }
    }

    fetchUser()
  }, [userId])

  // MARK COMPLETE
  const markComplete = async (videoId) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/progress/update",
        { userId, videoId }
      )

      setCompleted(res.data.completedVideos)

      if (res.data.completedVideos.length === 6) {
        setShowCertificate(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // DOWNLOAD CERTIFICATE (PDF)
  const downloadCertificate = async () => {
  const element = document.getElementById("certificate")

  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 3,
    useCORS: true
  })

  const imgData = canvas.toDataURL("image/png")

  const pdf = new jsPDF("landscape", "mm", "a4")
  pdf.addImage(imgData, "PNG", 10, 10, 280, 190)

  pdf.save("Raksha_Certificate.pdf")
}

  const progress = (completed.length / 6) * 100

  return (
    <div className="p-6 bg-linear-to-br from-pink-50 to-purple-100 min-h-screen">

      {/* HEADER */}
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl font-bold mb-6 text-center"
      >
        Raksha Women Safety Digital Course
      </motion.h1>

      <div className="grid grid-cols-3 gap-6">

        {/* PLAYER */}
        <div className="col-span-2 bg-white p-4 rounded-xl shadow">
          <CoursePlayer video={currentVideo} />

          {currentVideo && (
            <button
              onClick={() => markComplete(currentVideo.id)}
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-lg transition"
            >
              Mark as Completed ✅
            </button>
          )}
        </div>

        {/* VIDEO LIST */}
        <div className="space-y-3 bg-white p-4 rounded-xl shadow h-125 overflow-y-auto">
          <h2 className="font-semibold mb-2">Course Content</h2>

          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              completed={completed.includes(video.id)}
              onClick={setCurrentVideo}
            />
          ))}
        </div>
      </div>

      {/* PROGRESS */}
      <div className="bg-white p-4 rounded-xl shadow mt-5 mb-6">
        <p className="font-semibold mb-2">Course Progress</p>
        <ProgressBar progress={progress} />
      </div>

      {/* CERTIFICATE + RATING */}
      {showCertificate && (
        <div className="mt-10 bg-white p-6 rounded-xl shadow text-center">

          <Certificate username={username} />

          {/* DOWNLOAD BUTTON */}
          <button
            onClick={downloadCertificate}
            className="mt-6 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            Download Certificate 📄
          </button>

          {/* ⭐ RATING */}
          <div className="mt-6">
            <p className="font-semibold mb-2">Rate this course:</p>

            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                className={`text-3xl cursor-pointer ${
                  star <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}

            <p className="mt-2 text-gray-600">
              {rating ? `You rated ${rating}/5 ⭐` : "No rating yet"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoursePage