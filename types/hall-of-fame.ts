export interface MentorComment {
  authorName: string;
  authorAvatar: string;
  commentText: string;
  timestamp?: string;
  likesCount?: number;
  isVerified?: boolean;
}

export interface HallOfFamer {
  id: string;
  studentName: string;
  studentAvatar?: string;
  cohort?: string;
  location?: string;
  studentDescription?: string;
  challengeId?: string;
  challengeTitle?: string;
  pieceTitle?: string;
  ragaName?: string;
  videoUrl: string;
  videoType?: 'gdrive' | 'youtube' | 'direct';
  customThumbnailUrl?: string;
  mentorPraise?: string;
  mentorComment?: MentorComment;
  dateFeatured?: string;
  badges?: any[];
  isFeatured?: boolean;
  orderIndex?: number;
  order_index?: number;
}
