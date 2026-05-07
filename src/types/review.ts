export type Review = {
  id: number;           // reviewId
  userId: number;
  userName: string;     // firstName + lastName from users table
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;    // PostgreSQL doesn't have updatedAt by default, so we'll use createdAt for simplicity
};

export type CreateReviewInput = {
  productId: number;
  rating: number;
  comment: string;
};

export type UpdateReviewInput = {
  reviewId: number;
  rating: number;
  comment: string;
};