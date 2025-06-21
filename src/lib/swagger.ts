import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api", // 定义API文件夹路径
    definition: {
      openapi: "3.0.0",
      info: {
        title: "用户微服务API文档",
        version: "1.0.0",
        description: "用户微服务的API接口文档",
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });
  return spec;
};