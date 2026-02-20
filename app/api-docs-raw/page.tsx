import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XtraSecurity API Docs (Raw)',
}

export default function ApiDocsRawPage() {
  const specUrl = "/api/docs";

  return (
    <div className="bg-[#0a0a0f] min-h-screen">
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <style dangerouslySetInnerHTML={{
        __html: `
          * { box-sizing: border-box; }
          .top-bar {
            background: linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 100%);
            border-bottom: 1px solid rgba(99, 102, 241, 0.25);
            padding: 16px 32px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
           .top-bar { display: none; } /* Hide top bar when embedded */
          #swagger-ui {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px 64px 16px;
          }
          /* Override Swagger default styles */
          .swagger-ui .topbar { display: none !important; }
          .swagger-ui .info { padding: 32px 0 24px 0; }
          .swagger-ui .info .title { color: #e2e8f0; font-size: 28px; font-weight: 700; }
          .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info a { color: #94a3b8; }
          .swagger-ui { background: transparent !important; }
          .swagger-ui .scheme-container {
            background: #10101c;
            box-shadow: none;
            border: 1px solid rgba(99,102,241,0.2);
            border-radius: 8px;
            padding: 12px 20px;
            margin-bottom: 24px;
          }
          .swagger-ui .opblock-tag {
            color: #c7d2fe !important;
            border-bottom: 1px solid rgba(99,102,241,0.15) !important;
          }
          .swagger-ui .opblock {
            border-radius: 8px !important;
            border: 1px solid rgba(255,255,255,0.07) !important;
            background: #10101c !important;
            box-shadow: none !important;
            margin-bottom: 8px !important;
          }
          .swagger-ui .opblock .opblock-summary { border-radius: 8px !important; }
          .swagger-ui .opblock-summary-method {
            border-radius: 4px !important;
            font-weight: 700 !important;
            min-width: 70px !important;
          }
          .swagger-ui .opblock-summary-description { color: #94a3b8 !important; }
          .swagger-ui .opblock.opblock-get { border-color: rgba(59,130,246,0.3) !important; }
          .swagger-ui .opblock.opblock-post { border-color: rgba(16,185,129,0.3) !important; }
          .swagger-ui .opblock.opblock-put { border-color: rgba(245,158,11,0.3) !important; }
          .swagger-ui .opblock.opblock-delete { border-color: rgba(239,68,68,0.3) !important; }
          .swagger-ui .opblock .opblock-body { background: #10101c !important; }
          .swagger-ui .tab li { color: #94a3b8 !important; }
          .swagger-ui .tab li.active { color: #e2e8f0 !important; }
          .swagger-ui section.models { background: #10101c; border: 1px solid rgba(99,102,241,0.2); border-radius: 8px; }
          .swagger-ui section.models .model-container { background: #10101c; }
          .swagger-ui .model-title { color: #c7d2fe !important; }
          .swagger-ui table thead tr th { color: #94a3b8 !important; border-color: rgba(255,255,255,0.07) !important; }
          .swagger-ui table tbody tr td { color: #cbd5e1 !important; border-color: rgba(255,255,255,0.07) !important; }
          .swagger-ui .parameters-col_description p, .swagger-ui .renderedMarkdown p { color: #94a3b8 !important; }
          .swagger-ui label { color: #94a3b8 !important; }
          .swagger-ui .btn { border-radius: 6px !important; }
          .swagger-ui .btn.execute { background: linear-gradient(135deg, #6366f1, #8b5cf6) !important; border: none !important; }
          .swagger-ui .btn.authorize { border-color: #6366f1 !important; color: #818cf8 !important; }
          .swagger-ui .response-col_status { color: #818cf8 !important; }
          .swagger-ui .highlight-code pre, .swagger-ui .microlight { background: #0a0a14 !important; border-radius: 6px !important; }
          .swagger-ui select { background: #1a1a2e; color: #e2e8f0; border: 1px solid rgba(99,102,241,0.3); }
          .swagger-ui input[type=text] { background: #1a1a2e; color: #e2e8f0; border: 1px solid rgba(99,102,241,0.3); }
          .swagger-ui textarea { background: #1a1a2e !important; color: #e2e8f0 !important; border: 1px solid rgba(99,102,241,0.3) !important; }
          .swagger-ui .dialog-ux .modal-ux { background: #10101c; border: 1px solid rgba(99,102,241,0.3); }
          .swagger-ui .dialog-ux .modal-ux-header { background: #0a0a14; border-bottom: 1px solid rgba(99,102,241,0.2); }
          .swagger-ui .dialog-ux .modal-ux-header h3, .swagger-ui .dialog-ux .modal-ux-content p { color: #e2e8f0; }
        ` }} />

      <div id="swagger-ui"></div>

      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" />
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
          window.onload = function() {
            window.ui = SwaggerUIBundle({
              url: "${specUrl}",
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: "StandaloneLayout",
              deepLinking: true,
              displayOperationId: false,
              defaultModelsExpandDepth: 1,
              defaultModelExpandDepth: 2,
              docExpansion: "list",
              filter: true,
              tryItOutEnabled: true,
              syntaxHighlight: {
                activate: true,
                theme: "monokai"
              }
            });
          };
        `,
        }}
      />
    </div>
  );
}
