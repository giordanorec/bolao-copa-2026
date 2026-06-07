"""Gera o payload EMV BR Code PIX e o QR Code SVG.

Salva: v4/public/pix-qr.svg e v4/public/pix-payload.txt

Uso:
    python marketing/scripts/gerar_pix_qr.py
"""

from __future__ import annotations

from pathlib import Path

CHAVE = "grec@cin.ufpe.br"
NOME = "ARENA DAS IAS"  # max 25 chars
CIDADE = "RECIFE"  # max 15 chars

ROOT = Path(__file__).resolve().parent.parent.parent
OUT_SVG = ROOT / "v4" / "public" / "pix-qr.svg"
OUT_TXT = ROOT / "v4" / "public" / "pix-payload.txt"


def crc16_ccitt(payload: str) -> str:
    """CRC16-CCITT (poly 0x1021, init 0xFFFF) — padrão BR Code."""
    crc = 0xFFFF
    for b in payload.encode("utf-8"):
        crc ^= b << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return f"{crc:04X}"


def tlv(tag: str, value: str) -> str:
    """ID + 2-digit length + value."""
    return f"{tag}{len(value):02d}{value}"


def gerar_payload() -> str:
    # Merchant Account Info (Tag 26, sub-template)
    gui = tlv("00", "BR.GOV.BCB.PIX")
    chave = tlv("01", CHAVE)
    mai = gui + chave
    # Builds the BR Code
    parts = [
        tlv("00", "01"),  # Payload Format Indicator
        tlv("26", mai),  # Merchant Account Info
        tlv("52", "0000"),  # Merchant Category Code
        tlv("53", "986"),  # Currency BRL
        tlv("58", "BR"),  # Country
        tlv("59", NOME[:25]),  # Merchant Name
        tlv("60", CIDADE[:15]),  # Merchant City
        tlv("62", tlv("05", "***")),  # Additional Data (TXID livre)
    ]
    payload_sem_crc = "".join(parts) + "6304"
    crc = crc16_ccitt(payload_sem_crc)
    return payload_sem_crc + crc


def qr_svg(payload: str, size: int = 320) -> str:
    """Gera QR SVG usando qrcode-svg minimal embed (sem libs externas)."""
    try:
        import qrcode  # type: ignore
        import qrcode.image.svg  # type: ignore
        from qrcode.image.svg import SvgImage  # type: ignore

        img = qrcode.make(
            payload,
            image_factory=SvgImage,
            box_size=10,
            border=2,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
        )
        from io import BytesIO

        bio = BytesIO()
        img.save(bio)
        return bio.getvalue().decode("utf-8")
    except ImportError:
        # Fallback: gerar via API externa (qrserver.com)
        import urllib.parse
        import urllib.request

        url = (
            "https://api.qrserver.com/v1/create-qr-code/"
            f"?size={size}x{size}&format=svg&data="
            + urllib.parse.quote(payload)
        )
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; bolao-pix-qr/1.0)"
            },
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8")


def main() -> None:
    payload = gerar_payload()
    print(f"Payload PIX (BR Code):\n{payload}\n")
    print(f"Tamanho: {len(payload)} chars")
    OUT_TXT.write_text(payload, encoding="utf-8")
    print(f"✓ Salvo: {OUT_TXT}")
    svg = qr_svg(payload)
    OUT_SVG.write_text(svg, encoding="utf-8")
    print(f"✓ QR SVG: {OUT_SVG}")


if __name__ == "__main__":
    main()
