import React from 'react';
import { 
    IoPulseOutline, IoMedicalOutline, IoCheckmarkCircleOutline, IoShieldCheckmarkOutline, IoWarningOutline 
} from 'react-icons/io5';

interface WeightGuideProps {
    preHeight: string;
    setPreHeight: (val: string) => void;
    preWeight: string;
    setPreWeight: (val: string) => void;
    bmiResult: number | null;
    bmiCategory: string;
    bmiRecommendation: any;
    onCalculateBmi: () => void;
}

export const WeightGuide: React.FC<WeightGuideProps> = ({
    preHeight,
    setPreHeight,
    preWeight,
    setPreWeight,
    bmiResult,
    bmiCategory,
    bmiRecommendation,
    onCalculateBmi
}) => {
    return (
        <div id="view-medical" className="fade-in">
            <div className="medical-grid" style={{ marginBottom: '24px' }}>
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 900 }}>
                        <IoPulseOutline style={{ color: '#db2777' }} /> Tính toán chỉ số cân nặng BMI trước bầu
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                        Nhập chiều cao và cân nặng trước khi mang thai để biết mức tăng cân khuyến nghị lý tưởng theo Viện Dinh Dưỡng Quốc Gia.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="text-label">Chiều cao (cm)</label>
                            <input 
                                type="number" 
                                placeholder="Ví dụ: 158" 
                                value={preHeight} 
                                onChange={(e) => setPreHeight(e.target.value)} 
                                className="form-input" 
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="text-label">Cân nặng trước bầu (kg)</label>
                            <input 
                                type="number" 
                                placeholder="Ví dụ: 50" 
                                value={preWeight} 
                                onChange={(e) => setPreWeight(e.target.value)} 
                                className="form-input" 
                            />
                        </div>
                    </div>

                    <button className="calculate-bmi-btn" onClick={onCalculateBmi} style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '14px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 10px rgba(219, 39, 119, 0.15)'
                    }}>
                        Tính chỉ số khuyến nghị
                    </button>

                    {bmiResult && (
                        <div style={{ marginTop: '10px', padding: '16px', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-sub)' }}>BMI của mẹ:</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#db2777' }}>{bmiResult.toFixed(1)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-sub)' }}>Trạng thái:</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#db2777' }}>{bmiCategory}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 900 }}>
                        <IoMedicalOutline style={{ color: '#db2777' }} /> Hướng dẫn tăng cân y khoa khuyến nghị
                    </h3>
                    
                    {bmiRecommendation ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', borderLeft: '4px solid #db2777' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 800 }}>Mức tăng cân khuyên dùng cả thai kỳ</h4>
                                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#db2777' }}>
                                    {bmiRecommendation.gainRange || bmiRecommendation.totalRange}
                                </p>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 800 }}>Tốc độ tăng cân khuyên dùng ở TCN 2 & 3</h4>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                                    {bmiRecommendation.weeklyRate}
                                </p>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', fontStyle: 'italic', lineHeight: 1.5 }}>
                                *Lưu ý: Mức khuyến nghị này áp dụng cho thai đơn. Trường hợp đa thai (sinh đôi, sinh ba), mẹ cần tham vấn trực tiếp ý kiến của bác sĩ sản khoa phụ trách để có lộ trình chính xác nhất.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '160px', color: '#cbd5e1' }}>
                            <IoCheckmarkCircleOutline style={{ fontSize: '3rem', marginBottom: '10px' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 600, textAlign: 'center' }}>Vui lòng nhập chỉ số bên trái và bấm Tính toán để xem khuyến nghị.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Standard Micronutrients for Pregnancy Table / Grid */}
            <div className="card" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '24px', marginBottom: '24px' }}>
                <h3 className="section-title" style={{ color: 'var(--primary)', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IoShieldCheckmarkOutline /> 6 Vi chất vàng cần bổ sung chuẩn y khoa
                </h3>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.86rem', margin: '4px 0 20px 0' }}>
                    Bảng hướng dẫn liều lượng bổ sung vi chất hàng ngày theo hướng dẫn của Viện Dinh dưỡng Quốc gia và Bộ Y tế.
                </p>
                
                <div className="medical-table-wrapper">
                    <table className="medical-table">
                        <thead>
                            <tr>
                                <th>Vi chất</th>
                                <th>Liều dùng hàng ngày</th>
                                <th>Vai trò đối với thai nhi & mẹ</th>
                                <th>Lưu ý y khoa quan trọng</th>
                                <th>Nguồn thực phẩm tự nhiên</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="bold-cell text-primary">Axit Folic<br /><small>(Folate / B9)</small></td>
                                <td className="bold-cell">400 - 600 mcg</td>
                                <td>Ngăn ngừa dị tật ống thần kinh (nứt đốt sống, vô sọ). Hỗ trợ sản xuất hồng cầu.</td>
                                <td>Cực kỳ quan trọng trong <strong>3 tháng đầu thai kỳ</strong> (nên uống từ trước khi mang thai 1-3 tháng).</td>
                                <td>Rau bina, bông cải xanh, măng tây, quả bơ, các loại đậu, nước cam.</td>
                            </tr>
                            <tr>
                                <td className="bold-cell text-danger">Sắt<br /><small>(Iron)</small></td>
                                <td className="bold-cell">30 - 60 mg</td>
                                <td>Cấu tạo nên Hemoglobin của hồng cầu, cung cấp oxy cho thai nhi, phòng ngừa thiếu máu, sinh non.</td>
                                <td>Nên uống chung với <strong>Vitamin C</strong> (nước cam, chanh) để tăng hấp thu. Tránh uống cùng Canxi/sữa/trà/cà phê.</td>
                                <td>Thịt bò nạc, lòng đỏ trứng, thịt chim bồ câu, cá hồi, rau xanh đậm.</td>
                            </tr>
                            <tr>
                                <td className="bold-cell text-warning">Canxi<br /><small>(Calcium)</small></td>
                                <td className="bold-cell">1000 - 1200 mg</td>
                                <td>Xây dựng hệ xương răng cho thai nhi. Phòng ngừa chuột rút, loãng xương và tiền sản giật cho mẹ.</td>
                                <td>Nên uống vào <strong>buổi sáng/trưa</strong> sau ăn. <strong>Không uống chung với Sắt</strong> (phải cách nhau tối thiểu 2 giờ).</td>
                                <td>Sữa tươi tiệt trùng, phô mai pasteur, sữa chua, cua đồng, tôm tép nhỏ ăn cả vỏ.</td>
                            </tr>
                            <tr>
                                <td className="bold-cell text-info">DHA & Omega-3</td>
                                <td className="bold-cell">Tối thiểu 200 mg</td>
                                <td>Phát triển tối ưu tế bào não bộ, hệ thần kinh trung ương và thị giác (võng mạc) của bé.</td>
                                <td>Uống ngay sau bữa ăn giàu chất béo để cơ thể hấp thu tối đa dưỡng chất.</td>
                                <td>Cá hồi, trứng gà, hạt óc chó, hạt hạnh nhân, hạt chia.</td>
                            </tr>
                            <tr>
                                <td className="bold-cell" style={{ color: '#8b5cf6' }}>Vitamin D3</td>
                                <td className="bold-cell">600 - 800 IU</td>
                                <td>Hỗ trợ cơ thể hấp thụ và chuyển hóa Canxi hiệu quả từ ruột vào xương thai nhi.</td>
                                <td>Thiếu vitamin D sẽ dẫn đến còi xương ngay từ trong bụng mẹ và tăng nguy cơ tiền sản giật.</td>
                                <td>Tắm nắng sớm (10-15 phút), lòng đỏ trứng gà, nấm, sữa bầu.</td>
                            </tr>
                            <tr>
                                <td className="bold-cell" style={{ color: '#0ea5e9' }}>I-ốt<br /><small>(Iodine)</small></td>
                                <td className="bold-cell">150 - 220 mcg</td>
                                <td>Điều hòa hoóc-môn tuyến giáp, ngăn ngừa sảy thai, thai chết lưu, dị tật bẩm sinh hay đần độn ở trẻ.</td>
                                <td>Sử dụng muối i-ốt hoặc bột canh i-ốt hàng ngày thay vì muối thường.</td>
                                <td>Muối i-ốt, rong biển tiệt trùng, tôm cá biển, trứng.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Food Safety & High-Risk Pathogens Section */}
            <div className="card" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '24px' }}>
                <h3 className="section-title" style={{ color: '#be123c', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IoWarningOutline /> Nguyên tắc an toàn thực phẩm y khoa (Cấm & Hạn chế)
                </h3>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.86rem', margin: '4px 0 20px 0' }}>
                    Tránh các nguồn lây nhiễm vi khuẩn gây biến chứng nghiêm trọng trong thai kỳ.
                </p>
                
                <div className="medical-grid-safety">
                    <div className="safety-card" style={{ borderLeft: '4px solid #ef4444' }}>
                        <h4 style={{ margin: '0 0 6px 0', color: '#991b1b', fontSize: '0.92rem', fontWeight: 800 }}>Khuẩn Listeria monocytogenes</h4>
                        <p style={{ fontSize: '0.8rem', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
                            Có thể gây sảy thai, thai chết lưu hoặc nhiễm trùng sơ sinh nặng.
                            <br /><strong>🚫 Tuyệt đối tránh:</strong> Sữa tươi chưa tiệt trùng (raw milk), phô mai mềm chưa tiệt trùng (feta, brie, camembert), pate gan bảo quản lạnh, xúc xích/thịt nguội chưa được nấu chín lại đến bốc hơi, rau mầm sống.
                        </p>
                    </div>
                    <div className="safety-card" style={{ borderLeft: '4px solid #f97316' }}>
                        <h4 style={{ margin: '0 0 6px 0', color: '#9a3412', fontSize: '0.92rem', fontWeight: 800 }}>Ký sinh trùng Toxoplasma gondii</h4>
                        <p style={{ fontSize: '0.8rem', color: '#7c2d12', margin: 0, lineHeight: 1.5 }}>
                            Lây nhiễm qua nhau thai gây mù lòa, điếc, tổn thương não bộ thai nhi.
                            <br /><strong>🚫 Tuyệt đối tránh:</strong> Thịt sống/tái (sashimi, beefsteak tái, nem chua, thịt chua), rau củ quả rửa không kỹ dưới vòi nước chảy.
                            <br /><em>⚠️ Lưu ý: Đeo găng tay khi làm vườn và rửa tay sạch sau khi tiếp xúc với đất cát hoặc dọn chất thải của mèo.</em>
                        </p>
                    </div>
                    <div className="safety-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                        <h4 style={{ margin: '0 0 6px 0', color: '#1e3a8a', fontSize: '0.92rem', fontWeight: 800 }}>Nhiễm độc kim loại nặng (Thủy ngân)</h4>
                        <p style={{ fontSize: '0.8rem', color: '#172554', margin: 0, lineHeight: 1.5 }}>
                            Tích tụ thủy ngân liều cao gây tổn thương nghiêm trọng hệ thần kinh đang phát triển của bé.
                            <br /><strong>🚫 Tuyệt đối tránh:</strong> Các loài cá săn mồi lớn như Cá mập, Cá kiếm, Cá thu hoàng hậu (king mackerel), Cá kình, Cá ngừ đại dương mắt to.
                            <br /><strong>✅ Nên chọn:</strong> Cá hồi, cá cơm, cá trích, tôm, cua, cá rô phi (tối đa 2-3 bữa/tuần).
                        </p>
                    </div>
                    <div className="safety-card" style={{ borderLeft: '4px solid #db2777' }}>
                        <h4 style={{ margin: '0 0 6px 0', color: '#831843', fontSize: '0.92rem', fontWeight: 800 }}>Chất kích thích & Độc tố sinh học</h4>
                        <p style={{ fontSize: '0.8rem', color: '#500724', margin: 0, lineHeight: 1.5 }}>
                            <strong>🚫 Rượu bia:</strong> Cấm tuyệt đối. Gây hội chứng rượu bào thai (FAS), chậm phát triển tâm thần vận động.
                            <br /><strong>⚠️ Caffeine (Cà phê, trà đặc):</strong> Hạn chế dưới 200mg/ngày. Sử dụng nhiều làm co thắt mạch máu bánh nhau, tăng nguy cơ sảy thai, nhẹ cân khi sinh.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
