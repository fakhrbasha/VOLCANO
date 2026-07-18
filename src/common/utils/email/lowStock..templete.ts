interface LowStockTemplateProps {
    materialName: string;
    colorName: string;
    currentQuantity: number;
    minQuantity: number;
}

export const templateLowStock = ({
    materialName,
    colorName,
    currentQuantity,
    minQuantity,
}: LowStockTemplateProps) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Low Stock Alert</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f4;">
    <div style="padding:30px; background-color:#f4f4f4;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

            <div style="background:#dc2626; padding:20px; text-align:center;">
                <h1 style="color:#ffffff; margin:0;">
                    ⚠️ Low Stock Alert
                </h1>
            </div>

            <div style="padding:30px;">
                <p style="font-size:16px; color:#374151;">
                    A material has reached its minimum stock threshold and requires attention.
                </p>

                <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                    <tr>
                        <td style="padding:12px; border-bottom:1px solid #e5e7eb; font-weight:bold;">
                            Material
                        </td>
                        <td style="padding:12px; border-bottom:1px solid #e5e7eb;">
                            ${materialName}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:12px; border-bottom:1px solid #e5e7eb; font-weight:bold;">
                            Color
                        </td>
                        <td style="padding:12px; border-bottom:1px solid #e5e7eb;">
                            ${colorName}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:12px; border-bottom:1px solid #e5e7eb; font-weight:bold;">
                            Current Quantity
                        </td>
                        <td style="padding:12px; border-bottom:1px solid #e5e7eb; color:#dc2626; font-weight:bold;">
                            ${currentQuantity}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:12px; font-weight:bold;">
                            Minimum Quantity
                        </td>
                        <td style="padding:12px;">
                            ${minQuantity}
                        </td>
                    </tr>
                </table>

                <div style="margin-top:25px; padding:16px; background:#fef2f2; border-left:4px solid #dc2626; border-radius:6px;">
                    <strong style="color:#b91c1c;">
                        Action Required
                    </strong>
                    <p style="margin:8px 0 0; color:#7f1d1d;">
                        Please restock this material as soon as possible to avoid production delays.
                    </p>
                </div>
            </div>

            <div style="background:#f9fafb; padding:15px; text-align:center; color:#6b7280; font-size:13px;">
                FAKHR-ERP • Inventory Management System
            </div>

        </div>
    </div>
</body>
</html>
`;
};