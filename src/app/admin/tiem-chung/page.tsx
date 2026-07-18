'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
    IoCalendarOutline, IoCheckmarkCircle, IoTimeOutline, IoChevronForwardOutline, 
    IoInformationCircleOutline, IoPulseOutline, IoAddCircleOutline, IoTrashOutline,
    IoCloseOutline
} from 'react-icons/io5';
import Link from 'next/link';

interface Vaccine {
    id: string;
    name: string;
    ageGroup: string;
    disease: string;
    description: string;
}

const DEFAULT_VACCINES: Vaccine[] = [
    // Sơ sinh (0 - 1 tháng)
    { id: 'bcg', name: 'Lao (BCG)', ageGroup: 'Sơ sinh', disease: 'Bệnh lao', description: 'Tiêm càng sớm càng tốt trong vòng 30 ngày sau sinh.' },
    { id: 'hepb_0', name: 'Viêm gan B (Sơ sinh)', ageGroup: 'Sơ sinh', disease: 'Viêm gan B', description: 'Tiêm trong vòng 24 giờ đầu sau sinh.' },
    
    // Mốc 2 tháng
    { id: '6in1_1', name: '6 trong 1 (Mũi 1)', ageGroup: '2 tháng', disease: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B', description: 'Phòng ngừa 6 bệnh truyền nhiễm nguy hiểm hàng đầu.' },
    { id: 'pneumo_1', name: 'Phế cầu (Mũi 1 - PCV13)', ageGroup: '2 tháng', disease: 'Viêm phổi, Viêm màng não do phế cầu khuẩn', description: 'Giúp bé tránh các bệnh viêm tai giữa, nhiễm trùng huyết và viêm phổi nặng.' },
    { id: 'rota_1', name: 'Uống Rota (Mũi 1)', ageGroup: '2 tháng', disease: 'Tiêu chảy cấp do Rotavirus', description: 'Nhỏ miệng liều đầu tiên.' },
    
    // Mốc 3 tháng
    { id: '6in1_2', name: '6 trong 1 (Mũi 2)', ageGroup: '3 tháng', disease: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B', description: 'Tiêm cách mũi 1 tối thiểu 1 tháng.' },
    { id: 'pneumo_2', name: 'Phế cầu (Mũi 2 - PCV13)', ageGroup: '3 tháng', disease: 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', description: 'Mũi tiêm tiếp theo phòng phế cầu khuẩn.' },
    { id: 'rota_2', name: 'Uống Rota (Mũi 2)', ageGroup: '3 tháng', disease: 'Tiêu chảy cấp do Rotavirus', description: 'Hoàn thành liều uống thứ 2 bảo vệ bé.' },
    
    // Mốc 4 tháng
    { id: '6in1_3', name: '6 trong 1 (Mũi 3)', ageGroup: '4 tháng', disease: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B', description: 'Hoàn thành phác đồ cơ bản 3 mũi tiêm 6in1.' },
    { id: 'pneumo_3', name: 'Phế cầu (Mũi 3 - PCV13)', ageGroup: '4 tháng', disease: 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', description: 'Mũi tiêm phế cầu thứ 3 cho trẻ.' },
    { id: 'rota_3', name: 'Uống Rota (Mũi 3 - nếu có)', ageGroup: '4 tháng', disease: 'Tiêu chảy cấp do Rotavirus', description: 'Nhỏ liều cuối đối với loại vắc xin Rota phác đồ 3 liều.' },
    
    // Mốc 6 tháng
    { id: 'flu_1', name: 'Cúm mùa (Mũi 1)', ageGroup: '6 tháng', disease: 'Cúm mùa', description: 'Dành cho trẻ từ 6 tháng tuổi trở lên. Cần tiêm 2 mũi trước 12 tháng.' },
    { id: 'mening_1', name: 'Não mô cầu BC (Mũi 1)', ageGroup: '6 tháng', disease: 'Viêm màng não do não mô cầu khuẩn BC', description: 'Bảo vệ trẻ trước chủng khuẩn não mô cầu nhóm B và C.' },
    
    // Mốc 7 tháng
    { id: 'flu_2', name: 'Cúm mùa (Mũi 2)', ageGroup: '7 tháng', disease: 'Cúm mùa', description: 'Tiêm sau mũi đầu 1 tháng để tạo miễn dịch tốt.' },
    { id: 'mening_2', name: 'Não mô cầu BC (Mũi 2)', ageGroup: '7 tháng', disease: 'Viêm màng não do não mô cầu khuẩn BC', description: 'Tiêm nhắc lại cách mũi 1 tối thiểu 1 tháng.' },
    
    // Mốc 9 tháng
    { id: 'measles_1', name: 'Sởi đơn (Mũi 1)', ageGroup: '9 tháng', disease: 'Bệnh sởi', description: 'Mũi sởi đơn đầu tiên theo lịch Tiêm chủng mở rộng.' },
    { id: 'mening_acyw_1', name: 'Não mô cầu ACYW (Mũi 1)', ageGroup: '9 tháng', disease: 'Viêm màng não do não mô cầu khuẩn A, C, Y, W-135', description: 'Tiêm liều đầu phòng ngừa 4 nhóm huyết thanh của não mô cầu.' },
    
    // Mốc 12 tháng
    { id: 'je_1', name: 'Viêm não Nhật Bản (Mũi 1)', ageGroup: '12 tháng', disease: 'Viêm não Nhật Bản', description: 'Sử dụng vắc xin Imojev (sống giảm độc lực) hoặc Jevax.' },
    { id: 'mmr_1', name: 'Sởi - Quai bị - Rubella (MMR Mũi 1)', ageGroup: '12 tháng', disease: 'Sởi, Quai bị, Rubella', description: 'Tạo miễn dịch tổng hợp vô cùng quan trọng.' },
    { id: 'varicella_1', name: 'Thủy đậu (Mũi 1)', ageGroup: '12 tháng', disease: 'Bệnh thủy đậu', description: 'Phòng ngừa thủy đậu lây lan.' },
    { id: 'hepa_1', name: 'Viêm gan A (Mũi 1)', ageGroup: '12 tháng', disease: 'Viêm gan A', description: 'Tiêm bảo vệ gan cho em bé.' },
    { id: 'pneumo_4', name: 'Phế cầu (Mũi 4 nhắc)', ageGroup: '12 tháng', disease: 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', description: 'Mũi nhắc lại quan trọng cách mũi 3 ít nhất 6 tháng.' },
    { id: 'mening_acyw_2', name: 'Não mô cầu ACYW (Mũi 2 nhắc)', ageGroup: '12 tháng', disease: 'Viêm màng não do não mô cầu khuẩn A, C, Y, W-135', description: 'Mũi tiêm nhắc cách mũi 1 ít nhất 3 tháng (đối với trẻ bắt đầu tiêm từ 9 tháng tuổi).' },
    
    // Mốc 18 tháng
    { id: '6in1_4', name: '6 trong 1 (Mũi 4 nhắc)', ageGroup: '18 tháng', disease: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B', description: 'Mũi nhắc lại rất quan trọng giúp duy trì và kéo dài hiệu lực bảo vệ.' },
    
    // Mốc 24 tháng
    { id: 'hepa_2', name: 'Viêm gan A (Mũi 2)', ageGroup: '24 tháng', disease: 'Viêm gan A', description: 'Tiêm mũi nhắc lại cách mũi 1 tối thiểu 6 tháng.' },
    { id: 'je_2', name: 'Viêm não Nhật Bản (Mũi 2)', ageGroup: '24 tháng', disease: 'Viêm não Nhật Bản', description: 'Tiêm nhắc lại sau mũi 1 từ 1 - 2 năm (đối với vắc xin Imojev).' },
    
    // Vị thành niên (9 - 17 tuổi)
    { id: 'hpv_teen_1', name: 'Ngừa HPV (Mũi 1)', ageGroup: '9 - 17 tuổi', disease: 'Ung thư cổ tử cung, vòm họng, sùi mào gà do HPV', description: 'Khuyến nghị cho cả nam và nữ từ 9 tuổi trở lên để bảo vệ tối ưu trước khi có quan hệ tình dục.' },
    { id: 'hpv_teen_2', name: 'Ngừa HPV (Mũi 2)', ageGroup: '9 - 17 tuổi', disease: 'Ung thư cổ tử cung, vòm họng, sùi mào gà do HPV', description: 'Tiêm cách mũi 1 từ 5 đến 12 tháng (áp dụng cho trẻ dưới 15 tuổi).' },
    { id: 'hpv_teen_3', name: 'Ngừa HPV (Mũi 3)', ageGroup: '9 - 17 tuổi', disease: 'Ung thư cổ tử cung, vòm họng, sùi mào gà do HPV', description: 'Mũi thứ 3 dành cho phác đồ tiêm từ 15 tuổi trở lên (tiêm cách mũi 2 ít nhất 3 tháng).' },
    { id: 'tdap_teen', name: 'Bạch hầu - Ho gà - Uốn ván (Tdap nhắc)', ageGroup: '9 - 17 tuổi', disease: 'Bạch hầu, Ho gà, Uốn ván', description: 'Tiêm nhắc lại 1 liều ở độ tuổi 9 - 15 tuổi để duy trì hệ miễn dịch.' },
    { id: 'mmr_teen', name: 'Sởi - Quai bị - Rubella (MMR Mũi 2)', ageGroup: '9 - 17 tuổi', disease: 'Sởi, Quai bị, Rubella', description: 'Mũi tiêm nhắc lại củng cố miễn dịch suốt đời (thường tiêm ở lứa tuổi học đường).' },
    { id: 'varicella_teen', name: 'Thủy đậu (Mũi 2)', ageGroup: '9 - 17 tuổi', disease: 'Bệnh thủy đậu', description: 'Tiêm nhắc lại cách mũi 1 tối thiểu 3 tháng.' },
    { id: 'mening_acyw_teen', name: 'Não mô cầu ACYW (Mũi nhắc)', ageGroup: '9 - 17 tuổi', disease: 'Viêm màng não do não mô cầu khuẩn A, C, Y, W-135', description: 'Tiêm 1 liều nhắc duy trì bảo vệ ở tuổi học đường.' }
];

const MOM_VACCINES: Vaccine[] = [
    // Trong thai kỳ
    { id: 'mom_vat_1', name: 'Uốn ván mũi 1 (VAT 1)', ageGroup: 'Trong thai kỳ', disease: 'Uốn ván sơ sinh', description: 'Tiêm liều đầu tiên từ tuần thai thứ 20 trở đi (thường khoảng tuần 22).' },
    { id: 'mom_vat_2', name: 'Uốn ván mũi 2 (VAT 2)', ageGroup: 'Trong thai kỳ', disease: 'Uốn ván sơ sinh', description: 'Tiêm cách mũi 1 ít nhất 1 tháng và trước ngày dự sinh tối thiểu 1 tháng.' },
    { id: 'mom_flu', name: 'Cúm mùa', ageGroup: 'Trong thai kỳ', disease: 'Cúm mùa và biến chứng', description: 'Tiêm 1 liều ở bất kỳ tuần thai nào nhằm bảo vệ mẹ khỏi viêm phổi nặng và truyền kháng thể bảo vệ bé 6 tháng đầu đời.' },
    { id: 'mom_dtap', name: 'Ho gà - Bạch hầu - Uốn ván (Tdap)', ageGroup: 'Trong thai kỳ', disease: 'Ho gà, Bạch hầu, Uốn ván', description: 'Tiêm 1 liều duy nhất từ tuần 27 - 36 (tốt nhất tuần 27 - 32) giúp tạo tối đa kháng thể phòng ho gà truyền cho con trước sinh.' },

    // Chuẩn bị mang thai
    { id: 'pre_mmr', name: 'Sởi - Quai bị - Rubella (MMR)', ageGroup: 'Chuẩn bị mang thai', disease: 'Sởi, Quai bị, Rubella', description: 'Tiêm 2 liều cách nhau tối thiểu 1 tháng. Lưu ý: Nghiêm cấm mang thai trong ít nhất 1 tháng (tốt nhất là 3 tháng) sau tiêm.' },
    { id: 'pre_varicella', name: 'Thủy đậu (VAR)', ageGroup: 'Chuẩn bị mang thai', disease: 'Bệnh thủy đậu', description: 'Tiêm 2 liều cách nhau 1 tháng. Lưu ý: Phải tránh thai tối thiểu 1 tháng sau khi hoàn thành mũi tiêm cuối.' },
    { id: 'pre_hepb', name: 'Viêm gan B', ageGroup: 'Chuẩn bị mang thai', disease: 'Viêm gan B', description: 'Phác đồ 3 liều (0-1-6 tháng). Khuyên dùng để phòng ngừa lây nhiễm từ mẹ sang con.' },
    { id: 'pre_flu', name: 'Cúm mùa (Trước thai kỳ)', ageGroup: 'Chuẩn bị mang thai', disease: 'Cúm mùa', description: 'Tiêm trước khi bầu 1 mũi để bảo vệ sức khỏe qua giai đoạn tam cá nguyệt đầu nhạy cảm.' },
    { id: 'pre_dtap', name: 'Bạch hầu - Ho gà - Uốn ván (Tdap)', ageGroup: 'Chuẩn bị mang thai', disease: 'Bạch hầu, Ho gà, Uốn ván', description: 'Tiêm 1 liều trước mang thai để phòng ngừa ho gà lây nhiễm sang con.' },

    // Người lớn & Bệnh lý (Ba bầu / Người lao động)
    { id: 'adult_flu', name: 'Cúm mùa hằng năm', ageGroup: 'Người lớn & Bệnh lý', disease: 'Cúm mùa', description: 'Tiêm nhắc lại 1 liều mỗi năm. Đặc biệt khuyến cáo cho người lao động, người lớn >= 46 tuổi và người có bệnh nền mạn tính (tiểu đường, cao huyết áp, thận, tim mạch).' },
    { id: 'adult_dtap', name: 'Bạch hầu - Ho gà - Uốn ván (Tdap)', ageGroup: 'Người lớn & Bệnh lý', disease: 'Bạch hầu, Ho gà, Uốn ván', description: 'Tiêm nhắc lại 1 liều mỗi 10 năm để phòng ngừa lây bệnh ho gà cho trẻ sơ sinh trong nhà.' },
    { id: 'adult_mmr', name: 'Sởi - Quai bị - Rubella (MMR)', ageGroup: 'Người lớn & Bệnh lý', disease: 'Sởi, Quai bị, Rubella', description: 'Tiêm 2 liều cách nhau tối thiểu 1 tháng cho người lớn chưa có kháng thể hoặc chưa tiêm.' },
    { id: 'adult_varicella', name: 'Thủy đậu (VAR)', ageGroup: 'Người lớn & Bệnh lý', disease: 'Bệnh thủy đậu', description: 'Tiêm 2 liều cách nhau 1 tháng để phòng bệnh thủy đậu người lớn biến chứng nặng.' },
    { id: 'adult_hepb', name: 'Viêm gan B (Adult)', ageGroup: 'Người lớn & Bệnh lý', disease: 'Viêm gan B', description: 'Tiêm 3 liều (lịch 0-1-6 tháng) nếu xét nghiệm chưa có kháng thể bảo vệ.' },
    { id: 'adult_hpv', name: 'Ngừa ung thư cổ tử cung/vòm họng do HPV', ageGroup: 'Người lớn & Bệnh lý', disease: 'Ung thư cổ tử cung, vòm họng, sùi mào gà do HPV', description: 'Tiêm 3 liều (0-2-6 tháng) dành cho cả nam và nữ đến 26 tuổi.' },
    { id: 'adult_pneumo', name: 'Phế cầu khuẩn (PCV13)', ageGroup: 'Người lớn & Bệnh lý', disease: 'Phổi, màng não, huyết do phế cầu khuẩn', description: 'Tiêm 1 liều duy nhất. Đặc biệt quan trọng cho người lớn tuổi, người lao động và người có bệnh lý nền.' },
    { id: 'adult_mening_acyw', name: 'Não mô cầu ACYW', ageGroup: 'Người lớn & Bệnh lý', disease: 'Viêm màng não do não mô cầu khuẩn ACYW', description: 'Tiêm 1 hoặc 2 liều tùy chỉ định lâm sàng và bệnh kèm.' },
    { id: 'adult_mening_b', name: 'Não mô cầu nhóm B (Bexsero)', ageGroup: 'Người lớn & Bệnh lý', disease: 'Viêm màng não do não mô cầu khuẩn nhóm B', description: 'Tiêm 2 liều cách nhau tối thiểu 1 tháng.' },
    { id: 'adult_je', name: 'Viêm não Nhật Bản', ageGroup: 'Người lớn & Bệnh lý', disease: 'Viêm não Nhật Bản', description: 'Tiêm vắc xin thế hệ mới 1 mũi, nhắc lại sau 1-2 năm.' },
    { id: 'adult_typhoid', name: 'Thương hàn', ageGroup: 'Người lớn & Bệnh lý', disease: 'Bệnh thương hàn', description: 'Tiêm 1 liều, nhắc lại mỗi 3 năm đối với người sống hoặc làm việc tại khu vực có dịch tễ.' }
];

const BABY_AGE_GROUPS = ['Sơ sinh', '1 tháng', '2 tháng', '3 tháng', '4 tháng', '6 tháng', '7 tháng', '9 tháng', '12 tháng', '18 tháng', '24 tháng', '9 - 17 tuổi'];
const MOM_AGE_GROUPS = ['Trong thai kỳ', 'Chuẩn bị mang thai', 'Người lớn & Bệnh lý'];

interface RecVax {
    name: string;
    ageData: Record<'19-26' | '27-49' | '50-64' | 'ge-65', { type: 'standard' | 'risk_or_other' | 'clinical_decision' | 'none'; text: string }>;
    riskData?: Record<'pregnancy' | 'sgmd' | 'hiv_lt_200' | 'hiv_ge_200' | 'asplenia' | 'kidney' | 'heart_lung' | 'liver' | 'diabetes' | 'healthcare' | 'msm', { type: 'standard' | 'risk_or_other' | 'clinical_decision' | 'weigh_benefits' | 'contraindicated' | 'none'; text: string }>;
}

const RECOMMENDATION_DATA: RecVax[] = [
    {
        name: 'Cúm',
        ageData: {
            '19-26': { type: 'standard', text: '1 liều mỗi năm' },
            '27-49': { type: 'standard', text: '1 liều mỗi năm' },
            '50-64': { type: 'standard', text: '1 liều mỗi năm' },
            'ge-65': { type: 'standard', text: '1 liều mỗi năm' }
        },
        riskData: {
            pregnancy: { type: 'standard', text: '1 liều mỗi năm' },
            sgmd: { type: 'standard', text: '1 liều mỗi năm' },
            hiv_lt_200: { type: 'standard', text: '1 liều mỗi năm' },
            hiv_ge_200: { type: 'standard', text: '1 liều mỗi năm' },
            asplenia: { type: 'standard', text: '1 liều mỗi năm' },
            kidney: { type: 'standard', text: '1 liều mỗi năm' },
            heart_lung: { type: 'standard', text: '1 liều mỗi năm' },
            liver: { type: 'standard', text: '1 liều mỗi năm' },
            diabetes: { type: 'standard', text: '1 liều mỗi năm' },
            healthcare: { type: 'standard', text: '1 liều mỗi năm' },
            msm: { type: 'standard', text: '1 liều mỗi năm' }
        }
    },
    {
        name: 'Bạch hầu-Ho gà-Uốn ván (Tdap)',
        ageData: {
            '19-26': { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            '27-49': { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            '50-64': { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            'ge-65': { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' }
        },
        riskData: {
            pregnancy: { type: 'standard', text: '1 liều/thai kỳ' },
            sgmd: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            hiv_lt_200: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            hiv_ge_200: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            asplenia: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            kidney: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            heart_lung: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            liver: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            diabetes: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            healthcare: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' },
            msm: { type: 'standard', text: '1 liều (nhắc mỗi 10 năm)' }
        }
    },
    {
        name: 'Sởi-Quai bị-Rubella (MMR)',
        ageData: {
            '19-26': { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            '27-49': { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            '50-64': { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            'ge-65': { type: 'none', text: '' }
        },
        riskData: {
            pregnancy: { type: 'contraindicated', text: 'Chống chỉ định*' },
            sgmd: { type: 'contraindicated', text: 'Chống chỉ định' },
            hiv_lt_200: { type: 'contraindicated', text: 'Chống chỉ định' },
            hiv_ge_200: { type: 'clinical_decision', text: '' },
            asplenia: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            kidney: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            heart_lung: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            liver: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            diabetes: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            healthcare: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            msm: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' }
        }
    },
    {
        name: 'Thuỷ đậu (VAR)',
        ageData: {
            '19-26': { type: 'standard', text: '2 liều cách nhau ≥ 1-2 tháng' },
            '27-49': { type: 'standard', text: '2 liều cách nhau ≥ 1-2 tháng' },
            '50-64': { type: 'risk_or_other', text: '2 liều cách nhau ≥ 1 tháng' },
            'ge-65': { type: 'risk_or_other', text: '2 liều cách nhau ≥ 1 tháng' }
        },
        riskData: {
            pregnancy: { type: 'contraindicated', text: 'Chống chỉ định*' },
            sgmd: { type: 'contraindicated', text: 'Chống chỉ định' },
            hiv_lt_200: { type: 'contraindicated', text: 'Chống chỉ định' },
            hiv_ge_200: { type: 'clinical_decision', text: '' },
            asplenia: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            kidney: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            heart_lung: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            liver: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            diabetes: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            healthcare: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' },
            msm: { type: 'standard', text: '2 liều cách nhau ≥ 1 tháng' }
        }
    },
    {
        name: 'Human papillomavirus (HPV)',
        ageData: {
            '19-26': { type: 'standard', text: '3 liều, lịch tiêm 0-2-6 tháng' },
            '27-49': { type: 'clinical_decision', text: '27-45 tuổi' },
            '50-64': { type: 'none', text: '' },
            'ge-65': { type: 'none', text: '' }
        },
        riskData: {
            pregnancy: { type: 'contraindicated', text: 'Không khuyến cáo*' },
            sgmd: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            hiv_lt_200: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            hiv_ge_200: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            asplenia: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            kidney: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            heart_lung: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            liver: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            diabetes: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            healthcare: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' },
            msm: { type: 'standard', text: '≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng' }
        }
    },
    {
        name: 'Phế cầu (PCV 13)',
        ageData: {
            '19-26': { type: 'risk_or_other', text: '1 liều' },
            '27-49': { type: 'risk_or_other', text: '1 liều' },
            '50-64': { type: 'risk_or_other', text: '1 liều' },
            'ge-65': { type: 'risk_or_other', text: '1 liều' }
        },
        riskData: {
            pregnancy: { type: 'none', text: '' },
            sgmd: { type: 'risk_or_other', text: '1 liều' },
            hiv_lt_200: { type: 'risk_or_other', text: '1 liều' },
            hiv_ge_200: { type: 'risk_or_other', text: '1 liều' },
            asplenia: { type: 'risk_or_other', text: '1 liều' },
            kidney: { type: 'risk_or_other', text: '1 liều' },
            heart_lung: { type: 'risk_or_other', text: '1 liều' },
            liver: { type: 'risk_or_other', text: '1 liều' },
            diabetes: { type: 'risk_or_other', text: '1 liều' },
            healthcare: { type: 'risk_or_other', text: '1 liều' },
            msm: { type: 'none', text: '' }
        }
    },
    {
        name: 'Viêm gan A (HepA)',
        ageData: {
            '19-26': { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            '27-49': { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            '50-64': { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            'ge-65': { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' }
        },
        riskData: {
            pregnancy: { type: 'none', text: '' },
            sgmd: { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            hiv_lt_200: { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            hiv_ge_200: { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            asplenia: { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            kidney: { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            heart_lung: { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            liver: { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            diabetes: { type: 'risk_or_other', text: '2, 3 hoặc 4 liều tuỳ vắc-xin' },
            healthcare: { type: 'none', text: '' },
            msm: { type: 'risk_or_other', text: '' }
        }
    },
    {
        name: 'Viêm gan B (HepB)',
        ageData: {
            '19-26': { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            '27-49': { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            '50-64': { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            'ge-65': { type: 'risk_or_other', text: '≥ 60 tuổi' }
        },
        riskData: {
            pregnancy: { type: 'standard', text: '3 liều' },
            sgmd: { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            hiv_lt_200: { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            hiv_ge_200: { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            asplenia: { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            kidney: { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            heart_lung: { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            liver: { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            diabetes: { type: 'standard', text: '2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ' },
            healthcare: { type: 'risk_or_other', text: '' },
            msm: { type: 'standard', text: '' }
        }
    },
    {
        name: 'Viêm màng não mô cầu ACYW',
        ageData: {
            '19-26': { type: 'risk_or_other', text: '1 hoặc 2 liều tuỳ chỉ định lâm sàng' },
            '27-49': { type: 'risk_or_other', text: '1 hoặc 2 liều tuỳ chỉ định lâm sàng' },
            '50-64': { type: 'risk_or_other', text: '1 hoặc 2 liều tuỳ chỉ định lâm sàng' },
            'ge-65': { type: 'risk_or_other', text: '1 hoặc 2 liều tuỳ chỉ định lâm sàng' }
        },
        riskData: {
            pregnancy: { type: 'none', text: '' },
            sgmd: { type: 'risk_or_other', text: '1 hoặc 2 liều tuỳ chỉ định lâm sàng' },
            hiv_lt_200: { type: 'risk_or_other', text: '1 hoặc 2 liều tuỳ chỉ định lâm sàng' },
            hiv_ge_200: { type: 'risk_or_other', text: '1 hoặc 2 liều tuỳ chỉ định lâm sàng' },
            asplenia: { type: 'risk_or_other', text: '1 hoặc 2 liều tuỳ chỉ định lâm sàng' },
            kidney: { type: 'none', text: '' },
            heart_lung: { type: 'none', text: '' },
            liver: { type: 'none', text: '' },
            diabetes: { type: 'none', text: '' },
            healthcare: { type: 'risk_or_other', text: '' },
            msm: { type: 'none', text: '' }
        }
    },
    {
        name: 'Viêm màng não mô cầu B (MenB)',
        ageData: {
            '19-26': { type: 'clinical_decision', text: '19-23 tuổi' },
            '27-49': { type: 'risk_or_other', text: '2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng' },
            '50-64': { type: 'risk_or_other', text: '2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng' },
            'ge-65': { type: 'risk_or_other', text: '2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng' }
        },
        riskData: {
            pregnancy: { type: 'weigh_benefits', text: 'Cân nhắc' },
            sgmd: { type: 'risk_or_other', text: '2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng' },
            hiv_lt_200: { type: 'risk_or_other', text: '2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng' },
            hiv_ge_200: { type: 'risk_or_other', text: '2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng' },
            asplenia: { type: 'risk_or_other', text: '2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng' },
            kidney: { type: 'none', text: '' },
            heart_lung: { type: 'none', text: '' },
            liver: { type: 'none', text: '' },
            diabetes: { type: 'none', text: '' },
            healthcare: { type: 'risk_or_other', text: '' },
            msm: { type: 'none', text: '' }
        }
    },
    {
        name: 'Viêm não Nhật Bản',
        ageData: {
            '19-26': { type: 'risk_or_other', text: '1 hoặc 3 liều tuỳ vắc-xin' },
            '27-49': { type: 'risk_or_other', text: '1 hoặc 3 liều tuỳ vắc-xin' },
            '50-64': { type: 'risk_or_other', text: '1 hoặc 3 liều tuỳ vắc-xin' },
            'ge-65': { type: 'risk_or_other', text: '1 hoặc 3 liều tuỳ vắc-xin' }
        },
        riskData: {
            pregnancy: { type: 'contraindicated', text: 'Chống chỉ định vắc-xin sống*' },
            sgmd: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            hiv_lt_200: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            hiv_ge_200: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            asplenia: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            kidney: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            heart_lung: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            liver: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            diabetes: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            healthcare: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' },
            msm: { type: 'risk_or_other', text: '1 liều hoặc 3 liều' }
        }
    },
    {
        name: 'Thương hàn',
        ageData: {
            '19-26': { type: 'clinical_decision', text: '1 liều, nhắc lại mỗi 3 năm nếu có nguy cơ nhiễm bệnh' },
            '27-49': { type: 'clinical_decision', text: '1 liều, nhắc lại mỗi 3 năm nếu có nguy cơ nhiễm bệnh' },
            '50-64': { type: 'clinical_decision', text: '1 liều, nhắc lại mỗi 3 năm nếu có nguy cơ nhiễm bệnh' },
            'ge-65': { type: 'clinical_decision', text: '1 liều, nhắc lại mỗi 3 năm nếu có nguy cơ nhiễm bệnh' }
        }
    },
    {
        name: 'Tả',
        ageData: {
            '19-26': { type: 'clinical_decision', text: '2 liều cách nhau 14 ngày, nhắc lại nếu có nguy cơ nhiễm bệnh' },
            '27-49': { type: 'clinical_decision', text: '2 liều cách nhau 14 ngày, nhắc lại nếu có nguy cơ nhiễm bệnh' },
            '50-64': { type: 'clinical_decision', text: '2 liều cách nhau 14 ngày, nhắc lại nếu có nguy cơ nhiễm bệnh' },
            'ge-65': { type: 'clinical_decision', text: '2 liều cách nhau 14 ngày, nhắc lại nếu có nguy cơ nhiễm bệnh' }
        }
    },
    {
        name: 'Dại',
        ageData: {
            '19-26': { type: 'clinical_decision', text: 'Lịch tiêm dự phòng / Lịch tiêm sau phơi nhiễm (chỉ định tuỳ trường hợp)' },
            '27-49': { type: 'clinical_decision', text: 'Lịch tiêm dự phòng / Lịch tiêm sau phơi nhiễm (chỉ định tuỳ trường hợp)' },
            '50-64': { type: 'clinical_decision', text: 'Lịch tiêm dự phòng / Lịch tiêm sau phơi nhiễm (chỉ định tuỳ trường hợp)' },
            'ge-65': { type: 'clinical_decision', text: 'Lịch tiêm dự phòng / Lịch tiêm sau phơi nhiễm (chỉ định tuỳ trường hợp)' }
        }
    }
];

export default function ImmunizationTracker() {
    const [user, setUser] = useState<any>(null);
    const [userVax, setUserVax] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'baby' | 'mom' | 'recommendation'>('baby');
    
    // Recommendation Tab States
    const [recAge, setRecAge] = useState<'19-26' | '27-49' | '50-64' | 'ge-65'>('19-26');
    const [recConditions, setRecConditions] = useState<string[]>([]);
    const [recTableSelect, setRecTableSelect] = useState<'age' | 'risk'>('age');

    // Form State
    const [selectedVax, setSelectedVax] = useState<Vaccine | null>(null);
    const [isDone, setIsDone] = useState(false);
    const [dateDone, setDateDone] = useState('');
    const [reaction, setReaction] = useState('');
    const [notes, setNotes] = useState('');
    const [customVaxName, setCustomVaxName] = useState('');
    const [customVaxAge, setCustomVaxAge] = useState('2 tháng');
    const [showAddCustom, setShowAddCustom] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const unsubDb = onSnapshot(collection(db, "users", currentUser.uid, "immunizations"), (snap) => {
                    const data: Record<string, any> = {};
                    snap.docs.forEach(d => { data[d.id] = d.data(); });
                    setUserVax(data);
                    setLoading(false);
                });
                return () => unsubDb();
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const openVaxModal = (vax: Vaccine) => {
        setSelectedVax(vax);
        const record = userVax[vax.id];
        if (record) {
            setIsDone(!!record.dateDone);
            setDateDone(record.dateDone || new Date().toISOString().split('T')[0]);
            setReaction(record.reaction || '');
            setNotes(record.notes || '');
        } else {
            setIsDone(false);
            setDateDone(new Date().toISOString().split('T')[0]);
            setReaction('');
            setNotes('');
        }
    };

    const handleSaveRecord = async () => {
        if (!user || !selectedVax) return;
        const recordRef = doc(db, "users", user.uid, "immunizations", selectedVax.id);
        if (isDone) {
            await setDoc(recordRef, {
                id: selectedVax.id,
                name: selectedVax.name,
                ageGroup: selectedVax.ageGroup,
                disease: selectedVax.disease,
                dateDone,
                reaction,
                notes,
                isMom: activeTab === 'mom' || selectedVax.id.startsWith('mom_')
            }, { merge: true });
        } else {
            await deleteDoc(recordRef);
        }
        setSelectedVax(null);
    };

    const handleAddCustomVax = async () => {
        if (!user || !customVaxName.trim()) return;
        const customId = 'custom_' + (activeTab === 'mom' ? 'mom_' : '') + Date.now();
        const recordRef = doc(db, "users", user.uid, "immunizations", customId);
        await setDoc(recordRef, {
            id: customId,
            name: customVaxName,
            ageGroup: customVaxAge,
            disease: 'Tùy chọn',
            dateDone: new Date().toISOString().split('T')[0],
            reaction: '',
            notes: 'Mũi tiêm bổ sung tự chọn',
            isMom: activeTab === 'mom'
        });
        setCustomVaxName('');
        setShowAddCustom(false);
    };

    const handleDeleteCustomVax = async (id: string) => {
        if (!user || !confirm("Bạn có chắc chắn muốn xóa mũi tiêm tùy chọn này không?")) return;
        await deleteDoc(doc(db, "users", user.uid, "immunizations", id));
    };

    const toggleCondition = (cond: string) => {
        if (cond === 'hiv_lt_200') {
            setRecConditions(prev => prev.filter(c => c !== 'hiv_ge_200').includes(cond) ? prev.filter(c => c !== cond) : [...prev.filter(c => c !== 'hiv_ge_200'), cond]);
        } else if (cond === 'hiv_ge_200') {
            setRecConditions(prev => prev.filter(c => c !== 'hiv_lt_200').includes(cond) ? prev.filter(c => c !== cond) : [...prev.filter(c => c !== 'hiv_lt_200'), cond]);
        } else {
            setRecConditions(prev => prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]);
        }
    };

    const getPersonalizedRecommendation = (vaxName: string) => {
        const item = RECOMMENDATION_DATA.find(v => v.name === vaxName);
        if (!item) return null;

        let finalType = 'none';
        let finalText = '';
        let reason = '';

        if (recConditions.length > 0 && item.riskData) {
            const priorityOrder: Record<string, number> = {
                'contraindicated': 5,
                'weigh_benefits': 4,
                'clinical_decision': 3,
                'standard': 2,
                'risk_or_other': 2,
                'none': 1
            };

            let highestPriority = 0;
            let selectedKey = '';

            recConditions.forEach(cond => {
                const condData = item.riskData?.[cond as keyof typeof item.riskData];
                if (condData) {
                    const priority = priorityOrder[condData.type] || 1;
                    if (priority > highestPriority) {
                        highestPriority = priority;
                        finalType = condData.type;
                        finalText = condData.text;
                        selectedKey = cond;
                    }
                }
            });

            if (highestPriority > 1) {
                const condLabels: Record<string, string> = {
                    pregnancy: 'Mang thai',
                    sgmd: 'Suy giảm miễn dịch',
                    hiv_lt_200: 'HIV CD4 < 200',
                    hiv_ge_200: 'HIV CD4 ≥ 200',
                    asplenia: 'Thiếu lách/bổ thể',
                    kidney: 'Bệnh thận mạn/CTNT',
                    heart_lung: 'Bệnh tim/phổi/rượu',
                    liver: 'Bệnh gan mạn',
                    diabetes: 'Tiểu đường',
                    healthcare: 'Nhân viên y tế',
                    msm: 'QHTD đồng tính nam'
                };
                reason = `Dựa trên yếu tố: ${condLabels[selectedKey]}`;
            }
        }

        if (finalType === 'none' || finalText === '') {
            const ageData = item.ageData?.[recAge];
            if (ageData) {
                finalType = ageData.type;
                finalText = ageData.text;
                reason = `Theo độ tuổi: ${recAge === '19-26' ? '19-26 tuổi' : recAge === '27-49' ? '27-49 tuổi' : recAge === '50-64' ? '50-64 tuổi' : 'Trên 65 tuổi'}`;
            }
        }

        return { type: finalType, text: finalText, reason };
    };

    const activeList = activeTab === 'baby' ? [...DEFAULT_VACCINES] : (activeTab === 'mom' ? [...MOM_VACCINES] : []);
    Object.keys(userVax).forEach(id => {
        if (id.startsWith('custom_')) {
            const r = userVax[id];
            const isVaxForMom = r.isMom || id.startsWith('custom_mom_');
            if ((activeTab === 'mom' && isVaxForMom) || (activeTab === 'baby' && !isVaxForMom)) {
                activeList.push({
                    id: r.id,
                    name: r.name,
                    ageGroup: r.ageGroup,
                    disease: r.disease || 'Tùy chọn',
                    description: r.notes || 'Mũi tiêm tự chọn'
                });
            }
        }
    });

    const currentAgeGroups = activeTab === 'baby' ? BABY_AGE_GROUPS : (activeTab === 'mom' ? MOM_AGE_GROUPS : []);
    const groupedVaccines = currentAgeGroups.map(age => ({
        age,
        list: activeList.filter(v => v.ageGroup === age)
    })).filter(g => g.list.length > 0);

    const totalVaccines = activeList.length;
    const completedVaccines = activeList.filter(v => userVax[v.id]?.dateDone).length;
    const progressPercent = totalVaccines > 0 ? Math.round((completedVaccines / totalVaccines) * 100) : 0;

    return (
        <>
            <div className="utility-page-container fade-in">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '6px', borderRadius: '16px' }}>
                <button 
                    onClick={() => { setActiveTab('baby'); setCustomVaxAge('2 tháng'); }}
                    style={{ flex: '1 1 150px', padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', background: activeTab === 'baby' ? 'white' : 'transparent', color: activeTab === 'baby' ? '#10b981' : '#64748b', boxShadow: activeTab === 'baby' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                    🍼 Tiêm chủng cho Bé
                </button>
                <button 
                    onClick={() => { setActiveTab('mom'); setCustomVaxAge('Trong thai kỳ'); }}
                    style={{ flex: '1 1 150px', padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', background: activeTab === 'mom' ? 'white' : 'transparent', color: activeTab === 'mom' ? '#ec4899' : '#64748b', boxShadow: activeTab === 'mom' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                    🤰 Mẹ & Người lớn (Gia đình)
                </button>
                <button 
                    onClick={() => { setActiveTab('recommendation'); }}
                    style={{ flex: '1 1 150px', padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', background: activeTab === 'recommendation' ? 'white' : 'transparent', color: activeTab === 'recommendation' ? '#3b82f6' : '#64748b', boxShadow: activeTab === 'recommendation' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                    📋 Lịch Khuyến Cáo
                </button>
            </div>

            {activeTab === 'recommendation' ? (
                <div className="recommendation-container fade-in">
                    {/* Banner */}
                    <div className="vax-header-banner" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', boxShadow: '0 15px 35px -10px rgba(59, 130, 246, 0.4)', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                                <IoInformationCircleOutline size={30} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Lịch Tiêm Khuyến Cáo Cho Người Lớn</h2>
                                <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.45 }}>
                                    Tra cứu lịch tiêm chủng đầy đủ dựa trên WHO, CDC-ACIP và Hội Y học Dự phòng Việt Nam.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Filter Widget */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-soft)' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '6px', borderRadius: '8px', display: 'inline-flex' }}><IoPulseOutline size={18} /></span>
                            Công Cụ Tra Cứu Khuyến Cáo Cá Nhân Hóa
                        </h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                            Chọn nhóm tuổi và các tình trạng sức khỏe / yếu tố nguy cơ của bạn dưới đây để hệ thống tự động lọc và hiển thị chính xác các khuyến cáo vắc-xin phù hợp.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {/* Age Select */}
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}>1. Chọn nhóm tuổi của bạn:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {(['19-26', '27-49', '50-64', 'ge-65'] as const).map(age => {
                                        const label = age === '19-26' ? '19 - 26 tuổi' : age === '27-49' ? '27 - 49 tuổi' : age === '50-64' ? '50 - 64 tuổi' : '≥ 65 tuổi';
                                        const isSelected = recAge === age;
                                        return (
                                            <button
                                                key={age}
                                                onClick={() => setRecAge(age)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid',
                                                    borderColor: isSelected ? '#3b82f6' : '#cbd5e1',
                                                    background: isSelected ? '#eff6ff' : 'white',
                                                    color: isSelected ? '#1d4ed8' : '#475569',
                                                    fontWeight: 700,
                                                    fontSize: '0.82rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Conditions Checklist */}
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}>2. Chọn tình trạng sức khỏe / Yếu tố nguy cơ (nếu có):</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                                    {[
                                        { id: 'pregnancy', label: '🤰 Mang thai' },
                                        { id: 'sgmd', label: '🛡️ Suy giảm miễn dịch (trừ HIV)' },
                                        { id: 'hiv_lt_200', label: '🎗️ HIV (CD4 < 200 tế bào/μL)' },
                                        { id: 'hiv_ge_200', label: '🎗️ HIV (CD4 ≥ 200 tế bào/μL)' },
                                        { id: 'asplenia', label: '🧬 Thiếu lách / Thiếu bổ thể' },
                                        { id: 'kidney', label: '💧 Suy thận mạn tính / Lọc máu' },
                                        { id: 'heart_lung', label: '🫁 Bệnh tim, phổi mạn / Nghiện rượu' },
                                        { id: 'liver', label: '🧪 Bệnh gan mạn tính' },
                                        { id: 'diabetes', label: '🍬 Bệnh tiểu đường' },
                                        { id: 'healthcare', label: '🥼 Nhân viên y tế' },
                                        { id: 'msm', label: '👬 Nam quan hệ đồng tính (MSM)' }
                                    ].map(cond => {
                                        const isChecked = recConditions.includes(cond.id);
                                        return (
                                            <label
                                                key={cond.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 14px',
                                                    borderRadius: '12px',
                                                    border: '1px solid',
                                                    borderColor: isChecked ? '#3b82f6' : '#e2e8f0',
                                                    background: isChecked ? '#f0f9ff' : '#fafafa',
                                                    cursor: 'pointer',
                                                    fontSize: '0.82rem',
                                                    color: isChecked ? '#0369a1' : '#475569',
                                                    fontWeight: isChecked ? 700 : 500,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleCondition(cond.id)}
                                                    style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                                />
                                                <span>{cond.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Personalized Results Card */}
                        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.88rem', fontWeight: 800, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                📋 Kết quả phân tích nhanh lịch tiêm phù hợp với bạn:
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {RECOMMENDATION_DATA.map((vax, idx) => {
                                    const rec = getPersonalizedRecommendation(vax.name);
                                    if (!rec) return null;
                                    
                                    let badgeColor = '';
                                    let badgeBg = '';
                                    let borderStyle = '';
                                    let statusLabel = '';

                                    switch (rec.type) {
                                        case 'standard':
                                            badgeColor = '#854d0e';
                                            badgeBg = '#fef9c3';
                                            borderStyle = '1px solid #fef08a';
                                            statusLabel = 'Tiêm chủng chuẩn';
                                            break;
                                        case 'risk_or_other':
                                            badgeColor = '#6b21a8';
                                            badgeBg = '#f3e8ff';
                                            borderStyle = '1px solid #e9d5ff';
                                            statusLabel = 'Khuyến cáo bổ sung';
                                            break;
                                        case 'clinical_decision':
                                            badgeColor = '#1e40af';
                                            badgeBg = '#dbeafe';
                                            borderStyle = '1px solid #bfdbfe';
                                            statusLabel = 'Tham vấn lâm sàng';
                                            break;
                                        case 'weigh_benefits':
                                            badgeColor = '#c2410c';
                                            badgeBg = '#fff7ed';
                                            borderStyle = '1px solid #fed7aa';
                                            statusLabel = 'Cân nhắc lợi ích';
                                            break;
                                        case 'contraindicated':
                                            badgeColor = '#991b1b';
                                            badgeBg = '#fee2e2';
                                            borderStyle = '1px solid #fecaca';
                                            statusLabel = 'Chống chỉ định';
                                            break;
                                        default:
                                            badgeColor = '#64748b';
                                            badgeBg = '#f1f5f9';
                                            borderStyle = '1px solid #e2e8f0';
                                            statusLabel = 'Không chỉ định chuẩn';
                                    }

                                    let displayText = rec.text;
                                    if (!displayText) {
                                        if (rec.type === 'clinical_decision') displayText = 'Theo chỉ định của bác sĩ điều trị lâm sàng.';
                                        else if (rec.type === 'risk_or_other') displayText = 'Có khuyến cáo tiêm chủng khi có nguy cơ phơi nhiễm hoặc yếu tố dịch tễ.';
                                        else if (rec.type === 'standard') displayText = 'Tiêm chủng theo lịch tiêu chuẩn người lớn.';
                                        else displayText = 'Không có khuyến cáo đặc biệt.';
                                    }

                                    return (
                                        <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'white', border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: '200px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>{vax.name}</strong>
                                                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: badgeBg, color: badgeColor, border: borderStyle, fontWeight: 700 }}>
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                                                    👉 <strong>Khuyến nghị:</strong> {displayText}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '8px' }}>
                                                ({rec.reason})
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Complete Table Views */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow-soft)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>Bảng Tra Cứu Đầy Đủ (100% Theo Ảnh Minh Họa)</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>Trình bày chi tiết hệ thống bảng khuyến cáo tiêm chủng người lớn của Bộ Y tế và các tổ chức y khoa.</p>
                            </div>
                            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                                <button
                                    onClick={() => setRecTableSelect('age')}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: recTableSelect === 'age' ? 'white' : 'transparent',
                                        color: recTableSelect === 'age' ? '#1e40af' : '#64748b',
                                        boxShadow: recTableSelect === 'age' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    📅 Bảng 1: Theo Độ Tuổi
                                </button>
                                <button
                                    onClick={() => setRecTableSelect('risk')}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: recTableSelect === 'risk' ? 'white' : 'transparent',
                                        color: recTableSelect === 'risk' ? '#1e40af' : '#64748b',
                                        boxShadow: recTableSelect === 'risk' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ⚠️ Bảng 2: Theo Yếu Tố Nguy Cơ
                                </button>
                            </div>
                        </div>

                        <div className="mobile-swipe-indicator" style={{ display: 'none', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '12px' }}>
                            <span>👉 Vuốt ngang để xem đầy đủ các cột của bảng thông tin</span>
                        </div>

                        {recTableSelect === 'age' ? (
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                                <table className="vax-grid-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '220px', textAlign: 'left' }}>Vắc-xin</th>
                                            <th>19-26 tuổi</th>
                                            <th>27-49 tuổi</th>
                                            <th>50-64 tuổi</th>
                                            <th>≥ 65 tuổi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="vax-name-cell">Cúm</td>
                                            <td colSpan={4} className="cell-standard text-center">1 liều mỗi năm</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Bạch hầu-Ho gà-Uốn ván (Tdap)</td>
                                            <td colSpan={4} className="cell-standard text-center">1 liều (nhắc mỗi 10 năm)</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Sởi-Quai bị-Rubella (MMR)</td>
                                            <td colSpan={3} className="cell-standard text-center">2 liều cách nhau ≥ 1 tháng</td>
                                            <td className="cell-none text-center">Không khuyến cáo</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Thuỷ đậu (VAR)</td>
                                            <td colSpan={2} className="cell-standard text-center">2 liều cách nhau ≥ 1-2 tháng</td>
                                            <td colSpan={2} className="cell-risk text-center">2 liều cách nhau ≥ 1 tháng</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Human papillomavirus (HPV)</td>
                                            <td className="cell-standard text-center">3 liều<br/><span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>lịch tiêm 0-2-6 tháng</span></td>
                                            <td className="cell-clinical text-center">27-45 tuổi</td>
                                            <td colSpan={2} className="cell-none text-center">Không khuyến cáo</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Phế cầu (PCV 13)</td>
                                            <td colSpan={4} className="cell-risk text-center">1 liều</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Viêm gan A (HepA)</td>
                                            <td colSpan={4} className="cell-risk text-center">2, 3 hoặc 4 liều tuỳ vắc-xin</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Viêm gan B (HepB)</td>
                                            <td colSpan={3} className="cell-standard text-center">2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ</td>
                                            <td className="cell-risk text-center">≥ 60 tuổi</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Viêm màng não mô cầu ACYW</td>
                                            <td colSpan={4} className="cell-risk text-center">1 hoặc 2 liều tuỳ chỉ định lâm sàng</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Viêm màng não mô cầu B (MenB)</td>
                                            <td className="cell-risk text-center" style={{ padding: '8px' }}>
                                                <span style={{ display: 'block', background: '#dbeafe', color: '#1e40af', border: '1.5px solid #bfdbfe', borderRadius: '6px', padding: '2px 4px', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '4px' }}>19-23 tuổi</span>
                                                <span style={{ fontSize: '0.72rem' }}>2 hoặc 3 liều tuỳ vắc-xin & CĐLS</span>
                                            </td>
                                            <td colSpan={3} className="cell-risk text-center">2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Viêm não Nhật Bản</td>
                                            <td colSpan={4} className="cell-risk text-center">1 hoặc 3 liều tuỳ vắc-xin</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Thương hàn</td>
                                            <td colSpan={4} className="cell-clinical text-center">1 liều, nhắc lại mỗi 3 năm nếu có nguy cơ nhiễm bệnh</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Tả</td>
                                            <td colSpan={4} className="cell-clinical text-center">2 liều cách nhau 14 ngày, nhắc lại nếu có nguy cơ nhiễm bệnh</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell">Dại</td>
                                            <td colSpan={4} className="cell-clinical text-center">Lịch tiêm dự phòng / Lịch tiêm sau phơi nhiễm (chỉ định tuỳ trường hợp)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                                <table className="vax-grid-table table-risk">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '180px', minWidth: '180px', position: 'sticky', left: 0, zIndex: 10, background: '#f8fafc', borderRight: '2px solid #cbd5e1', textAlign: 'left' }}>Vắc-xin</th>
                                            <th>Mang thai</th>
                                            <th>SGMD (trừ HIV)</th>
                                            <th>HIV CD4 &lt;200</th>
                                            <th>HIV CD4 &ge;200</th>
                                            <th>Thiếu lách, thiếu bổ thể</th>
                                            <th>Bệnh thận cuối hoặc đang CTNT</th>
                                            <th>Bệnh tim hoặc phổi; nghiện rượu</th>
                                            <th>Bệnh gan mãn tính</th>
                                            <th>Tiểu đường</th>
                                            <th>Nhân viên y tế</th>
                                            <th>QHTD đồng tính nam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>Cúm</td>
                                            <td colSpan={11} className="cell-standard text-center">1 liều mỗi năm</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>Tdap</td>
                                            <td className="cell-standard text-center">1 liều/thai kỳ</td>
                                            <td colSpan={10} className="cell-standard text-center">1 liều (nhắc mỗi 10 năm)</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>MMR</td>
                                            <td className="cell-contraindicated text-center">Chống chỉ định*</td>
                                            <td className="cell-contraindicated text-center">Chống chỉ định</td>
                                            <td className="cell-contraindicated text-center">Chống chỉ định</td>
                                            <td className="cell-clinical text-center"></td>
                                            <td colSpan={7} className="cell-standard text-center">2 liều cách nhau ≥ 1 tháng</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>VAR</td>
                                            <td className="cell-contraindicated text-center">Chống chỉ định*</td>
                                            <td className="cell-contraindicated text-center">Chống chỉ định</td>
                                            <td className="cell-contraindicated text-center">Chống chỉ định</td>
                                            <td className="cell-clinical text-center"></td>
                                            <td colSpan={7} className="cell-standard text-center">2 liều cách nhau ≥ 1 tháng</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>HPV</td>
                                            <td className="cell-contraindicated text-center">Không khuyến cáo*</td>
                                            <td colSpan={10} className="cell-standard text-center">≤26 tuổi: 3 liều, lịch tiêm 0-2-6 tháng</td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>PCV13</td>
                                            <td className="cell-none text-center"></td>
                                            <td colSpan={8} className="cell-risk text-center">1 liều</td>
                                            <td className="cell-risk text-center">1 liều</td>
                                            <td className="cell-none text-center"></td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>HepA</td>
                                            <td className="cell-none text-center"></td>
                                            <td colSpan={8} className="cell-risk text-center">2, 3 hoặc 4 liều tuỳ vắc-xin</td>
                                            <td className="cell-none text-center"></td>
                                            <td className="cell-risk text-center"></td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>HepB</td>
                                            <td className="cell-standard text-center">3 liều</td>
                                            <td colSpan={8} className="cell-standard text-center">2, 3 hoặc 4 liều tuỳ vắc xin hoặc yếu tố nguy cơ</td>
                                            <td className="cell-risk text-center"></td>
                                            <td className="cell-standard text-center"></td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>MenACYW</td>
                                            <td className="cell-none text-center"></td>
                                            <td colSpan={4} className="cell-risk text-center">1 hoặc 2 liều tuỳ chỉ định lâm sàng</td>
                                            <td colSpan={4} className="cell-none text-center"></td>
                                            <td className="cell-risk text-center"></td>
                                            <td className="cell-none text-center"></td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>MenB</td>
                                            <td className="cell-weigh text-center">Cân nhắc</td>
                                            <td colSpan={4} className="cell-risk text-center">2 hoặc 3 liều tuỳ vắc-xin và chỉ định lâm sàng</td>
                                            <td colSpan={4} className="cell-none text-center"></td>
                                            <td className="cell-risk text-center"></td>
                                            <td className="cell-none text-center"></td>
                                        </tr>
                                        <tr>
                                            <td className="vax-name-cell" style={{ position: 'sticky', left: 0, zIndex: 5, background: '#f8fafc' }}>VNNB</td>
                                            <td className="cell-contraindicated text-center">Chống chỉ định vắc-xin sống*</td>
                                            <td colSpan={10} className="cell-risk text-center">1 liều hoặc 3 liều</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Legend & Notes */}
                        <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>Chú giải màu sắc và ký hiệu:</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fef9c3', border: '1.5px solid #fef08a' }} />
                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>Lịch tiêm chuẩn cho người chưa từng tiêm hoặc nhiễm bệnh.</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f3e8ff', border: '1.5px solid #e9d5ff' }} />
                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>Khuyến cáo cho người lớn có yếu tố nguy cơ hoặc chỉ định khác.</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#dbeafe', border: '1.5px solid #bfdbfe' }} />
                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>Khuyến cáo dựa trên quyết định lâm sàng chung.</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fff7ed', border: '1.5px solid #fed7aa' }} />
                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>Cân nhắc lợi ích và rủi ro trước khi tiêm chủng.</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fee2e2', border: '1.5px solid #fecaca' }} />
                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>Chống chỉ định hoặc không khuyên dùng.</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f8fafc', border: '1.5px solid #cbd5e1' }} />
                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>Không khuyến cáo tiêm thường quy / không chỉ định.</span>
                                </div>
                            </div>
                            
                            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6, background: '#fafafa', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                <div style={{ fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Lưu ý đặc biệt:</div>
                                <div>• <strong>* Tiêm chủng sau thai kì:</strong> Phụ nữ mang thai không được tiêm các loại vắc-xin sống giảm độc lực (như MMR, Thuỷ đậu, Viêm não Nhật Bản sống). Cần hoàn tất trước khi mang thai tối thiểu 1 tháng hoặc tiêm ngay sau khi sinh.</div>
                                <div>• <strong>1 CTNT:</strong> Chạy thận nhân tạo.</div>
                                <div>• <strong>2 QHTD:</strong> Quan hệ tình dục.</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="vax-header-banner" style={{ background: activeTab === 'mom' ? 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)' : undefined, boxShadow: activeTab === 'mom' ? '0 15px 35px -10px rgba(236, 72, 153, 0.4)' : undefined }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                                <IoCalendarOutline size={30} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>{activeTab === 'baby' ? 'Lịch Tiêm Chủng Cho Bé' : 'Lịch Tiêm Chủng Mẹ & Người Lớn'}</h2>
                                <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4 }}>{activeTab === 'baby' ? 'Bảo vệ bé yêu khỏe mạnh vững bước hành trình đầu đời.' : 'Quản lý vắc-xin bảo vệ sức khỏe cho mẹ bầu, giai đoạn chuẩn bị mang thai và các thành viên gia đình.'}</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', opacity: 0.95 }}>
                                <span>Đã hoàn thành</span>
                                <span>{completedVaccines}/{totalVaccines} Mũi tiêm ({progressPercent}%)</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progressPercent}%`, background: 'white', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>Danh sách mũi tiêm chủng</h3>
                        <button 
                            onClick={() => setShowAddCustom(true)}
                            style={{ background: activeTab === 'mom' ? '#ec4899' : '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: activeTab === 'mom' ? '0 4px 10px rgba(236, 72, 153, 0.2)' : '0 4px 10px rgba(16, 185, 129, 0.2)' }}
                        >
                            <IoAddCircleOutline size={18} /> Thêm mũi tùy chọn
                        </button>
                    </div>

                    <div className="vax-timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {groupedVaccines.map((group, groupIdx) => (
                            <div className="vax-group" key={groupIdx} style={{ background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '20px', boxShadow: 'var(--shadow-soft)' }}>
                                <h4 style={{ margin: '0 0 16px 0', color: activeTab === 'mom' ? '#db2777' : '#10b981', fontWeight: 900, fontSize: '1.05rem', borderBottom: '1.5px dashed #f1f5f9', paddingBottom: '10px' }}>
                                    {activeTab === 'baby' ? `Trẻ ở mốc ${group.age}` : `Khuyến nghị ở mốc ${group.age}`}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {group.list.map((vax, idx) => {
                                        const record = userVax[vax.id];
                                        const isDone = record && !!record.dateDone;
                                        return (
                                            <div 
                                                onClick={() => openVaxModal(vax)}
                                                className={`vax-item-card ${isDone ? 'done' : ''}`}
                                                key={idx}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '18px', border: '1.5px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.25s', background: isDone ? (activeTab === 'mom' ? '#fdf2f8' : '#f0fdf4') : '#fafafa', borderColor: isDone ? (activeTab === 'mom' ? '#fbcfe8' : '#bbf7d0') : '#f1f5f9' }}
                                            >
                                                <div style={{ flex: 1, paddingRight: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <strong style={{ fontSize: '0.92rem', color: isDone ? (activeTab === 'mom' ? '#9d174d' : '#14532d') : '#1e293b' }}>{vax.name}</strong>
                                                        {vax.id.startsWith('custom_') && (
                                                            <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>Tùy chọn</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: isDone ? (activeTab === 'mom' ? '#be185d' : '#15803d') : '#64748b', marginTop: '4px', fontWeight: 500 }}>Phòng bệnh: {vax.disease}</div>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>{vax.description}</p>
                                                    {isDone && record && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', fontSize: '0.75rem', color: activeTab === 'mom' ? '#9d174d' : '#166534', fontWeight: 600 }}>
                                                            <span>📅 Ngày tiêm: {record.dateDone.split('-').reverse().join('/')}</span>
                                                            {record.reaction && <span>🤒 Phản ứng: {record.reaction}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {isDone ? <IoCheckmarkCircle size={24} color={activeTab === 'mom' ? '#ec4899' : '#10b981'} /> : <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                                                    {vax.id.startsWith('custom_') && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomVax(vax.id); }} style={{ border: 'none', background: 'transparent', color: '#ef4444', padding: '6px', cursor: 'pointer' }}>
                                                            <IoTrashOutline size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {activeTab === 'mom' && (
                        <div style={{
                            marginTop: '28px',
                            padding: '20px',
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
                            border: '1.5px solid #fed7aa',
                            boxShadow: 'var(--shadow-soft)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c2410c', fontWeight: 800, marginBottom: '12px', fontSize: '0.95rem' }}>
                                <IoInformationCircleOutline size={20} />
                                <span>Vì sao người lớn tuổi & người có bệnh nền cần tiêm chủng?</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#7c2d12', lineHeight: 1.6, fontWeight: 500 }}>
                                Hệ thống miễn dịch sẽ có dấu hiệu lão hóa theo độ tuổi. Khi lớn tuổi hoặc có bệnh nền mãn tính (tiểu đường, cao huyết áp, COPD, suy thận...), hệ miễn dịch suy giảm khiến cơ thể nhạy cảm, dễ nhiễm khuẩn và dễ gặp biến chứng nặng hơn. Tiêm vắc-xin giúp củng cố lá chắn bảo vệ, tránh làm chuyển biến nặng các bệnh lý sẵn có.
                            </p>
                        </div>
                    )}
                </>
            )}
            </div>

            {selectedVax && (
                <div className="vax-modal-overlay" onClick={() => setSelectedVax(null)}>
                    <div className="vax-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-drag-handle"></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>{selectedVax.name}</h3>
                            <button onClick={() => setSelectedVax(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem' }}><IoCloseOutline /></button>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Mốc tiêm: {selectedVax.ageGroup} • Phòng bệnh: {selectedVax.disease}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '14px', borderRadius: '16px', background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                                <input type="checkbox" checked={isDone} onChange={(e) => setIsDone(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: activeTab === 'mom' ? '#ec4899' : '#10b981' }} />
                                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#334155' }}>Đã tiêm mũi vắc xin này</span>
                            </label>
                            {isDone && (
                                <>
                                    <input type="date" value={dateDone} onChange={(e) => setDateDone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0' }} />
                                    <input type="text" placeholder="Phản ứng sau tiêm" value={reaction} onChange={(e) => setReaction(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0' }} />
                                    <textarea placeholder="Ghi chú thêm..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', resize: 'none' }} />
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <button onClick={() => setSelectedVax(null)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1', background: 'white' }}>Đóng</button>
                            <button onClick={handleSaveRecord} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'mom' ? '#ec4899' : '#10b981', color: 'white', border: 'none' }}>Lưu lại</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddCustom && (
                <div className="vax-modal-overlay" onClick={() => setShowAddCustom(false)}>
                    <div className="vax-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-drag-handle"></div>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 900 }}>Thêm mũi tiêm tùy chọn</h3>
                        <input type="text" value={customVaxName} onChange={(e) => setCustomVaxName(e.target.value)} placeholder="Tên vắc xin..." style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', marginBottom: '16px' }} />
                        <select value={customVaxAge} onChange={(e) => setCustomVaxAge(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', marginBottom: '24px' }}>
                            {currentAgeGroups.map((age, i) => <option key={i} value={age}>{age}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowAddCustom(false)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1' }}>Hủy</button>
                            <button onClick={handleAddCustomVax} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'mom' ? '#ec4899' : '#10b981', color: 'white', border: 'none' }}>Thêm mới</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .vax-header-banner {
                    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 28px;
                    margin-bottom: 25px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 15px 35px -10px rgba(16, 185, 129, 0.4);
                }
                .vax-header-banner::before {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%; width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
                    pointer-events: none;
                }
                .vax-item-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0,0,0,0.03);
                    border-color: #cbd5e1;
                }
                .vax-item-card.done:hover {
                    border-color: #86efac;
                }
                .vax-modal-overlay {
                    display: flex;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 99999;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .vax-modal-sheet {
                    width: 100%;
                    max-width: 440px;
                    background: white;
                    border-radius: 28px;
                    padding: 24px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .modal-drag-handle {
                    display: none;
                    width: 40px;
                    height: 5px;
                    background: #cbd5e1;
                    border-radius: 3px;
                    margin: 0 auto 15px auto;
                }
                .vax-grid-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 20px 0;
                    font-size: 0.82rem;
                    border: 1px solid #cbd5e1;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .vax-grid-table th {
                    background: #f8fafc;
                    color: #334155;
                    font-weight: 800;
                    padding: 12px 14px;
                    border-bottom: 2px solid #cbd5e1;
                    border-right: 1px solid #e2e8f0;
                    text-align: center;
                }
                .vax-grid-table th:last-child {
                    border-right: none;
                }
                .vax-grid-table td {
                    padding: 12px 14px;
                    border-bottom: 1px solid #e2e8f0;
                    border-right: 1px solid #e2e8f0;
                    vertical-align: middle;
                }
                .vax-grid-table td:last-child {
                    border-right: none;
                }
                .vax-grid-table tr:last-child td {
                    border-bottom: none;
                }
                .vax-name-cell {
                    font-weight: 800;
                    color: #1e293b;
                    background: #f8fafc !important;
                    border-right: 2px solid #cbd5e1 !important;
                }
                .cell-standard {
                    background: #fef9c3 !important;
                    color: #854d0e !important;
                    border-color: #fef08a !important;
                    font-weight: 600;
                }
                .cell-risk {
                    background: #f3e8ff !important;
                    color: #6b21a8 !important;
                    border-color: #e9d5ff !important;
                    font-weight: 600;
                }
                .cell-clinical {
                    background: #dbeafe !important;
                    color: #1e40af !important;
                    border-color: #bfdbfe !important;
                    font-weight: 600;
                }
                .cell-weigh {
                    background: #fff7ed !important;
                    color: #c2410c !important;
                    border-color: #fed7aa !important;
                    font-weight: 600;
                }
                .cell-contraindicated {
                    background: #fee2e2 !important;
                    color: #991b1b !important;
                    border-color: #fecaca !important;
                    font-weight: 700;
                }
                .cell-none {
                    background: #f8fafc !important;
                    color: #94a3b8;
                }
                .table-risk th, .table-risk td {
                    min-width: 120px;
                }
                @keyframes zoomIn {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes slideUpV2 {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @media (max-width: 900px) {
                    .vax-modal-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                    .vax-modal-sheet {
                        border-radius: 28px 28px 0 0;
                        max-height: 85vh;
                        animation: slideUpV2 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .modal-drag-handle {
                        display: block;
                    }
                    .mobile-swipe-indicator {
                        display: flex !important;
                    }
                }
            `}</style>
        </>
    );
}
