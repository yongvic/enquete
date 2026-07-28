import QRCode from "qrcode";
import { getSurveyShareUrl } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const locale = req.nextUrl.searchParams.get("locale") || "fr";
  const url = getSurveyShareUrl(code.toUpperCase(), locale);

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#1E2A38", light: "#F7F5EF" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
