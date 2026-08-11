export type Resource = {
  id: string;
  title: string;
  summary: string;
  description: string;
  course: string;
  type: string;
  filename: string;
  fileType: string;
  size: string;
  updatedAt: string;
  downloads: number;
  pinned?: boolean;
  weekly?: boolean;
};

export type AdminResource = Resource & {
  status: "公开" | "隐藏";
};

export const itCourses = ["六年级 IT", "七年级 IT", "八年级 IT"];

export const extensionCourses = ["六年级 Python", "七年级 Python", "人工智能课程"];

export const courses = [...itCourses, ...extensionCourses];

export const resourceTypes = ["电子练习单", "课堂素材", "课件", "课堂练习"];

export const resources: Resource[] = [
  {
    id: "grade6-it-materials",
    title: "六年级 IT 课堂素材包",
    summary: "包含信息科技基础操作、文件管理和课堂任务单。",
    description:
      "用于六年级 IT 课程。学生下载后可直接查看任务单，并完成文件整理、基础操作和课堂练习。",
    course: "六年级 IT",
    type: "课堂素材",
    filename: "grade6_it_materials.zip",
    fileType: "ZIP",
    size: "3.0 MB",
    updatedAt: "2026-08-08",
    downloads: 68,
    pinned: true,
    weekly: true,
  },
  {
    id: "grade7-it-materials",
    title: "七年级 IT 课堂素材包",
    summary: "包含数据处理、表格练习和课堂演示文件。",
    description:
      "用于七年级 IT 课程。资源包包含表格数据、操作说明和课堂练习模板。",
    course: "七年级 IT",
    type: "课堂练习",
    filename: "grade7_it_materials.zip",
    fileType: "ZIP",
    size: "3.6 MB",
    updatedAt: "2026-08-08",
    downloads: 72,
    pinned: true,
  },
  {
    id: "grade8-it-materials",
    title: "八年级 IT 课堂素材包",
    summary: "包含综合实践素材、项目任务单和参考文件。",
    description:
      "用于八年级 IT 综合实践课。学生可下载项目素材并按照任务单完成课堂活动。",
    course: "八年级 IT",
    type: "课堂素材",
    filename: "grade8_it_materials.zip",
    fileType: "ZIP",
    size: "4.4 MB",
    updatedAt: "2026-08-07",
    downloads: 59,
  },
  {
    id: "grade6-python-start",
    title: "六年级 Python 入门素材包",
    summary: "包含第一课演示代码、课堂任务单和练习文件。",
    description:
      "用于六年级 Python 入门课堂。学生下载后可直接解压，按照任务单完成变量、输出和简单运算练习。",
    course: "六年级 Python",
    type: "课堂素材",
    filename: "grade6_python_start.zip",
    fileType: "ZIP",
    size: "3.2 MB",
    updatedAt: "2026-08-08",
    downloads: 86,
    pinned: true,
    weekly: true,
  },
  {
    id: "grade7-python-loop",
    title: "七年级 Python 循环结构示例",
    summary: "包含 for、while、计数器和课堂演示代码。",
    description:
      "用于七年级 Python 循环结构课堂。压缩包内包含演示源码、练习素材和教师讲解提示。",
    course: "七年级 Python",
    type: "课堂素材",
    filename: "grade7_python_loop.zip",
    fileType: "ZIP",
    size: "2.8 MB",
    updatedAt: "2026-08-08",
    downloads: 128,
    pinned: true,
    weekly: true,
  },
  {
    id: "ai-prompt-worksheet",
    title: "人工智能课程提示词任务单",
    summary: "包含提示词结构、课堂任务说明和评价表。",
    description:
      "用于人工智能课程，帮助学生理解提示词中的主体、风格、约束和迭代过程。",
    course: "人工智能课程",
    type: "课件",
    filename: "ai_prompt_worksheet.pdf",
    fileType: "PDF",
    size: "1.6 MB",
    updatedAt: "2026-08-05",
    downloads: 74,
    pinned: true,
  },
];

export const dashboardStats = {
  total: 6,
  published: 6,
  hidden: 0,
  downloads: 487,
};

export function getResource(id: string) {
  return resources.find((resource) => resource.id === id);
}
