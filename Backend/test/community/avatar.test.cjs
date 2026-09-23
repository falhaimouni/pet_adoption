const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  UploadsService,
} = require("../../dist/Backend/src/modules/uploads/uploads.service.js");
const { FileUploadCategory } = require("../../dist/shared/enums/index.js");
test("registered users can read current avatars but cannot delete another user avatar", async () => {
  const owner = { userId: "owner", role: { roleName: "VET" } };
  const manager = {
    getRepository: () => ({
      findOne: async () => owner,
      find: async () => [owner],
    }),
  };
  const service = new UploadsService({ manager }, {});
  const file = {
    category: FileUploadCategory.AVATAR,
    fileUrl: "/files/current",
  };
  await service.authorizeRetrieval(file, {
    userId: "adopter",
    role: "ADOPTER",
  });
  await assert.rejects(
    service.authorizeDeletion(manager, file, {
      userId: "adopter",
      role: "ADOPTER",
    }),
    /not allowed to delete/,
  );
  await assert.rejects(
    service.authorizeRetrieval(
      { ...file, fileUrl: "https://outside.test/avatar" },
      { userId: "adopter", role: "ADOPTER" },
    ),
    /not managed files/,
  );
});
