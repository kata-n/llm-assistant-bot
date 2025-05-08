export type DiffFile = {
  filename: string;
  patch?: string;
  status: string;
};

export type PRInfo = {
  title: string;
  body: string;
};
