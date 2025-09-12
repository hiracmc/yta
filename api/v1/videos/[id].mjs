import { Innertube } from 'youtubei.js';

function timeToSeconds(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }
  const parts = timeString.split(':').map(Number);
  let seconds = 0;
  if (parts.length === 1) {
    seconds = parts[0];
  } else if (parts.length === 2) {
    seconds = (parts[0] * 60) + parts[1];
  } else if (parts.length === 3) {
    seconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  return seconds;
}

function translate(text) {

  const map = {
    year: '年',
    years: '年',
    month: 'ヶ月',
    months: 'ヶ月',
    week: '週間',
    weeks: '週間',
    day: '日',
    days: '日',
    hour: '時間',
    hours: '時間',
    minute: '分',
    minutes: '分',
    second: '秒',
    seconds: '秒'
  };
  const parts = text.split(' ');
  if (parts.length === 3 && parts[2].toLowerCase() === 'ago') {
    const value = parts[0];
    const unit = parts[1];
    
    if (map[unit]) {
      return `${value}${map[unit]}前`;
    }
  }
  return text;
}

function parseViewCount(viewString) {
  if (!viewString || typeof viewString !== 'string') {
    return null;
  }
  const cleanedString = viewString.toLowerCase().replace(/ views?/g, '').replace(/,/g, '');
  let value = parseFloat(cleanedString);
  if (isNaN(value)) {
    return null;
  }
  if (cleanedString.endsWith('k')) {
    value *= 1000;
  } else if (cleanedString.endsWith('m')) {
    value *= 1_000_000;
  } else if (cleanedString.endsWith('b')) {
    value *= 1_000_000_000;
  }
  return Math.floor(value);
}

function time(text) {
  if (!text) return null;

  const parts = text.toLowerCase();
  if (parts.length < 2 || parts[parts.length - 1] !== 'ago') {
    return null;
  }

  const value = parseInt(parts[0], 10);
  const unit = parts[1];

  const date = new Date();

  switch (unit) {
    case 'year':
    case 'years':
      date.setFullYear(date.getFullYear() - value);
      break;
    case 'month':
    case 'months':
      date.setMonth(date.getMonth() - value);
      break;
    case 'week':
    case 'weeks':
      date.setDate(date.getDate() - value * 7);
      break;
    case 'day':
    case 'days':
      date.setDate(date.getDate() - value);
      break;
    case 'hour':
    case 'hours':
      date.setHours(date.getHours() - value);
      break;
    case 'minute':
    case 'minutes':
      date.setMinutes(date.getMinutes() - value);
      break;
    default:
      return null;
  }

  return date;
  
}

export default async function handler(req, res) {
  const {id}  = req.query;

  try {
    const yt = await Innertube.create();
    const info = await yt.getInfo(id);
    console.log("あなたのapiが使用されました")

    const formats = [
      ...(info.streaming_data?.formats || []),
      ...(info.streaming_data?.adaptive_formats || [])
    ];

    const formatStreams = formats.map(f => {
      const url = f.url || f.signature_cipher;

      return {
        url,
        itag: String(f.itag),
        type: f.mime_type,
        quality: f.quality || f.audio_quality || 'unknown',
        bitrate: f.bitrate,
        fps: f.fps || null,
        size: f.width && f.height ? `${f.width}x${f.height}` : null,
        resolution: f.quality_label || null,
        qualityLabel: f.quality_label || null,
        container: f.mime_type?.split('/')[1]?.split(';')[0] || null,
        encoding: f.mime_type?.includes('avc1')
          ? 'h264'
          : f.mime_type?.includes('vp9')
          ? 'vp9'
          : f.mime_type?.includes('opus')
          ? 'opus'
          : null
      };
    });

    const recommendedVideos =(info.watch_next_feed).filter(item => item.content_type === 'VIDEO').map(v => ({
      ispontubeapi:true,
      videoId: v.content_id,
      title: v.metadata.title.text,
      videoThumbnails: v.content_image.image,
      author: v.metadata.metadata.metadata_rows[0].metadata_parts[0].text.text,
      authorUrl: `/channel/${v.metadata.image?.decoratedAvatarView?.renderer_context?.command_context?.on_tap?.browseEndpoint?.payload?.browseId}`,
      authorId: v.metadata.image?.decoratedAvatarView?.renderer_context?.command_context?.on_tap?.browseEndpoint?.payload?.browseId,
      authorVerified: (v.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.runs?.[0]?.attachment?.element?.type?.imageType?.image?.sources?.[0]?.clientResource?.imageName === 'CHECK_CIRCLE_FILLED'),
      lengthSeconds: timeToSeconds(v.content_image?.overlays?.[0]?.badges?.[0]?.text),
      viewCountText: v.metadata.metadata.metadata_rows[1].metadata_parts[0].text.text.replace(/ views?/i, '').trim(),
      viewCount: parseViewCount(v.metadata.metadata.metadata_rows[1].metadata_parts[0].text.text),
      published: time(v.metadata.metadata.metadata_rows[1]?.metadata_parts?.[1]?.text?.text),
      publishedText: translate(v.metadata.metadata.metadata_rows[1]?.metadata_parts?.[1]?.text?.text)
    }));

    const data = {
      type: "video",
      title: info.basic_info.title,
      videoId: info.basic_info.id,
      videoThumbnails: info.basic_info.thumbnail || [],
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
      authorThumbnails: info.secondary_info.owner.author.thumbnails || [],
      subCountText: info.basic_info.author?.subscriber_count_text,
      lengthSeconds: info.basic_info.duration,
      allowRatings: true,
      isListed: true,
      liveNow: info.basic_info.is_live,
      isPostLiveDvr: info.basic_info.is_post_live_dvr,
      isUpcoming: info.basic_info.is_upcoming,
      dashUrl: info.streaming_data?.dash_manifest_url,
      adaptiveFormats: info.streaming_data?.adaptive_formats || [],
      formatStreams,
      //captions: info.captions || [],
      recommendedVideos
    };
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, data:err.stack });
  }
}
