export const getVideos = (req, res) => {
  const videos = [
    {
      id: 1,
      title: "Self Defense Basics",
      url: "https://www.youtube.com/embed/9m-x64bKfR4"
    },
    {
      id: 2,
      title: "Safety Awareness",
      url: "https://www.youtube-nocookie.com/embed/5AIGu4DaetM"
    },
    {
      id: 3,
      title: "Emergency Tips",
      url: "https://www.youtube-nocookie.com/embed/IisqrLOnqX8"
    },
    {
      id: 4,
      title: "Travel Safety",
      url: "https://www.youtube-nocookie.com/embed/VqAmcpa3pfQ"
    },
    {
      id: 5,
      title: "Digital Safety",
      url: "https://www.youtube-nocookie.com/embed/aO858HyFbKI"
    },
    {
      id: 6,
      title: "Public Awareness",
      url: "https://www.youtube-nocookie.com/embed/Rlt5UnfI0_I"
    }
  ]

  res.json(videos)
}