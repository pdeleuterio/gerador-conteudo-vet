export interface DailyPostContent {
    post_idea: string;
    caption: string;
    hashtags: string[];
}

export interface ImagePrompt {
    image_prompt: string;
}

export interface UnsplashImage {
  id: string;
  alt_description: string | null;
  urls: {
    small: string;
  };
  links: {
    html: string;
  };
  user: {
    name: string;
  };
}
