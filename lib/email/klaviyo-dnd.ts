// Builds a Klaviyo drag-and-drop (SYSTEM_DRAGGABLE) template definition from image slices: one section,
// one full-width row per slice with an image block (link + alt text), then a live footer (logo + text block with
// Klaviyo's unsubscribe / manage-preferences tags). Matches how Klaviyo's own editor stores sliced emails, so the
// result opens and edits normally in the drag-and-drop editor. Needs API revision 2026-10-15.

export const DND_REVISION = "2026-10-15";

type Img = { src: string; assetId?: string; href?: string; alt: string };
export type DndRow = Img | { cols: Img[] };

const zeroPad = { block_padding_top: 0, block_padding_bottom: 0, block_padding_left: 0, block_padding_right: 0 };
const row = (block: unknown) => ({ data: { styles: { column_layout: "1-column-full-width" } }, columns: [{ data: {}, blocks: [block] }] });
const LAYOUT: Record<number, string> = { 2: "2-columns-equal-width", 3: "3-columns-equal-width", 4: "4-columns-equal-width" };
const colRow = (imgs: Img[]) => ({ data: { styles: { column_layout: LAYOUT[imgs.length] } }, columns: imgs.map((i) => ({ data: {}, blocks: [image(i)] })) });
const image = (i: Img, styles: Record<string, unknown> = {}) => ({
  content_type: "block",
  type: "image",
  data: {
    properties: { dynamic: false, alt_text: i.alt, src: i.src, ...(i.assetId ? { asset_id: i.assetId } : {}), ...(i.href ? { href: i.href } : {}) },
    display_options: {},
    styles: { ...zeroPad, ...styles },
  },
});

export function rgbToHex(c: string) {
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? "#" + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("") : c;
}

export function dndDefinition(slices: DndRow[], footer: { bg: string; legal: string; logo?: Img }) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const bg = rgbToHex(footer.bg);
  const footerText = [
    `<p style="text-align:center;margin:0 0 10px;font-size:13px">{% manage_preferences 'Manage preferences' %} | {% unsubscribe 'Unsubscribe' %}</p>`,
    footer.legal ? `<p style="text-align:center;margin:0 0 10px">${esc(footer.legal)}</p>` : "",
    `<p style="text-align:center;margin:0">{{ organization.name }} · {{ organization.full_address }}</p>`,
  ].join("");
  return {
    body: {
      properties: { id: "root-container", css_class: "bodyTable" },
      styles: {},
      sections: [
        {
          content_type: "section", type: "section",
          data: { properties: {}, display_options: {}, styles: { stack_on_mobile: false } },
          rows: slices.map((s) => ('cols' in s ? colRow(s.cols) : row(image(s)))),
        },
        {
          content_type: "section", type: "section",
          data: { properties: {}, display_options: {}, styles: { stack_on_mobile: false, background_color: bg, inner_padding_top: 28, inner_padding_bottom: 32 } },
          rows: [
            ...(footer.logo ? [row(image(footer.logo, { align: "center", width: 92, max_width: 92, block_padding_bottom: 12 }))] : []),
            row({
              content_type: "block", type: "text",
              data: { content: footerText, display_options: {}, styles: { color: "#a3a3a3", font_family: "Helvetica, Arial, sans-serif", font_size: 12, line_height: 1.6, text_align: "center", block_padding_left: 36, block_padding_right: 36, block_padding_top: 0, block_padding_bottom: 0 } },
            }),
          ],
        },
      ],
    },
    styles: [
      { style_type: "base-styles", properties: {}, styles: { content_background_color: "transparent", margin_top: 0 } },
      { style_type: "text-styles", styles: {} },
      { style_type: "link-styles", styles: {} },
      { style_type: "heading-1-styles", styles: {} },
      { style_type: "heading-2-styles", styles: {} },
      { style_type: "heading-3-styles", styles: {} },
      { style_type: "heading-4-styles", styles: {} },
      { style_type: "mobile-styles", properties: {}, styles: { mobile_margin: 0 } },
    ],
  };
}
