const CoursePlayer = ({ video }) => {
  if (!video) return <div>Select a video</div>

  return (
    <div className="w-full h-100">
      <iframe
        className="w-full h-full rounded-xl"
        src={video.url}
        title={video.title}
        allowFullScreen
      />
    </div>
  )
}

export default CoursePlayer