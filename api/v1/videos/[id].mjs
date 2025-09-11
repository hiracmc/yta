import { Innertube } from 'youtubei.js';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const yt = await Innertube.create();
    const info = await yt.getInfo(id);

    const recommendedVideos = (info.related_videos || []).map(v => ({
      videoId: v.id,
      title: v.title,
      videoThumbnails: v.thumbnails || [],
      author: v.author?.name,
      authorUrl: v.author?.channel_url,
      authorId: v.author?.id,
      authorVerified: v.author?.is_verified,
      lengthSeconds: v.duration,
      viewCountText: v.short_view_count_text,
      viewCount: v.view_count,
      published: v.published,
      publishedText: v.published_text
    }));

    const data = {
      type: "video",
      title: info.basic_info.title,
      videoId: info.basic_info.id,
      videoThumbnails: info.basic_info.thumbnail?.thumbnails || [],
      storyboards: info.storyboards || [],
      description: info.basic_info.short_description,
      published: info.basic_info.publish_date,
      publishedText: info.basic_info.publish_date_text,
      keywords: info.basic_info.keywords,
      viewCount: info.basic_info.view_count,
      likeCount: info.basic_info.like_count,
      paid: info.basic_info.is_paid,
      premium: info.basic_info.is_premium,
      isFamilyFriendly: info.basic_info.is_family_safe,
      allowedRegions: info.basic_info.available_countries,
      genre: info.basic_info.category,
      genreUrl: null,
      author: info.basic_info.author?.name,
      authorId: info.basic_info.author?.id,
      authorUrl: info.basic_info.author?.channel_url,
      authorVerified: info.basic_info.author?.is_verified,
      authorThumbnails: info.basic_info.author?.thumbnails || [],
      subCountText: info.basic_info.author?.subscriber_count_text,
      lengthSeconds: info.basic_info.duration,
      allowRatings: true,
      isListed: true,
      liveNow: info.basic_info.is_live,
      isPostLiveDvr: info.basic_info.is_post_live_dvr,
      isUpcoming: info.basic_info.is_upcoming,
      dashUrl: info.streaming_data?.dash_manifest_url,
      adaptiveFormats: info.streaming_data?.adaptive_formats || [],
      formatStreams: info.streaming_data?.formats || [],
      captions: info.captions || [],
      recommendedVideos
    };

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
