import { describe, expect, it } from "vitest";

import { photoContentType } from "../contentType";

describe("photoContentType", () => {
  it("uses the picker's MIME type when it's allowed", () => {
    expect(photoContentType("image/png", "file:///x.jpg")).toBe("image/png");
  });

  it("rejects other image types like HEIC", () => {
    expect(photoContentType("image/heic", "file:///x.heic")).toBeNull();
  });

  it("falls back to data URIs and file extensions", () => {
    expect(photoContentType(undefined, "data:image/webp;base64,AAAA")).toBe(
      "image/webp",
    );
    expect(photoContentType(null, "file:///photos/IMG_1.JPG")).toBe(
      "image/jpeg",
    );
    expect(photoContentType(null, "blob:http://localhost/abc")).toBeNull();
  });
});
