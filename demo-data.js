/**
 * 데모 데이터 생성 헬퍼
 * 개발/테스트용
 */

function loadDemoData() {
    // 프로젝트 초기화
    ProjectService.update({ name: '웹 쇼핑몰 프로젝트' });
    
    // 팀원 추가 (새로운 구조: role은 빈 문자열, profile 필수)
    const member1 = MemberService.create('김철수', '', {
        majorType: 'ENGINEERING',
        skills: ['DEV', 'DATA'],
        preferredRoles: ['DEV', 'DATA', 'PL'],
        avoidRole: 'PRESENT'
    });
    
    const member2 = MemberService.create('이영희', '', {
        majorType: 'ENGINEERING',
        skills: ['DEV'],
        preferredRoles: ['DEV', 'PL'],
        avoidRole: 'DESIGN'
    });
    
    const member3 = MemberService.create('박민수', '', {
        majorType: 'DESIGN',
        skills: ['DESIGN', 'PRESENT'],
        preferredRoles: ['DESIGN', 'PRESENT'],
        avoidRole: 'DEV'
    });
    
    const member4 = MemberService.create('정지원', '', {
        majorType: 'HUMANITIES',
        skills: ['DOCS', 'PRESENT'],
        preferredRoles: ['PL', 'DOCS', 'PRESENT'],
        avoidRole: null
    });
    
    // 로그 추가 (최근 2주간) - 새로운 구조
    const today = new Date();
    const getDate = (daysAgo) => {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    };
    
    // 김철수 활동
    LogService.create({
        title: '로그인 페이지 UI 구현',
        types: ['구현(코딩)', '디자인'],
        date: getDate(14),
        startTime: '09:00',
        endTime: '12:00',
        taskScope: '사용자 인증',
        outputType: '코드',
        participants: [
            { memberId: member1.id, role: '구현', contributionScore: 5, comment: 'React 컴포넌트 개발', approved: true }
        ],
        whatIDid: 'React를 사용하여 로그인 페이지 UI를 구현했습니다.\n폼 검증 로직과 에러 메시지 표시 기능을 추가했습니다.\n반응형 디자인을 적용하여 모바일에서도 정상 작동하도록 했습니다.',
        why: '사용자 인증 기능의 프론트엔드 구현이 필요했습니다.',
        how: 'React, styled-components, Formik 라이브러리 사용',
        status: '완료',
        resultSummary: '로그인 페이지 완성, 폼 검증 및 에러 처리 구현',
        beforeAfter: '기존 HTML 폼 → React 컴포넌트로 전환',
        evidenceLink: 'https://github.com/example/login-page'
    });
    
    LogService.create({
        title: '상품 목록 페이지 개발',
        types: ['구현(코딩)'],
        date: getDate(12),
        startTime: '14:00',
        endTime: '18:00',
        taskScope: '상품 관리',
        outputType: '코드',
        participants: [
            { memberId: member1.id, role: '프론트엔드', contributionScore: 4, comment: 'UI 구현', approved: true },
            { memberId: member2.id, role: '백엔드 연동', contributionScore: 3, comment: 'API 연결', approved: true }
        ],
        whatIDid: '상품 목록을 그리드 형태로 표시하는 페이지를 개발했습니다.\n페이지네이션과 필터링 기능을 구현했습니다.\n백엔드 API와 연동하여 실제 데이터를 표시했습니다.',
        why: '사용자가 상품을 탐색할 수 있는 기능이 필요했습니다.',
        how: 'React Query로 데이터 페칭, CSS Grid로 레이아웃 구성',
        status: '완료',
        resultSummary: '상품 목록 페이지 완성, 페이지네이션 및 필터 기능 구현',
        evidenceLink: 'https://github.com/example/product-list'
    });
    
    LogService.create({
        title: '주간 회의 - 진행 상황 공유',
        types: ['회의·조율'],
        date: getDate(10),
        startTime: '10:00',
        endTime: '11:00',
        taskScope: '전체',
        outputType: '문서',
        participants: [
            { memberId: member1.id, role: '참석', contributionScore: 3, comment: '진행 상황 공유', approved: true },
            { memberId: member2.id, role: '참석', contributionScore: 3, comment: 'API 일정 논의', approved: true },
            { memberId: member3.id, role: '참석', contributionScore: 3, comment: '디자인 피드백', approved: true },
            { memberId: member4.id, role: '진행', contributionScore: 5, comment: '회의 주최 및 정리', approved: true }
        ],
        whatIDid: '각 팀원의 진행 상황을 공유하고 이슈를 논의했습니다.\n다음 주 일정과 우선순위를 조율했습니다.\n디자인 시스템 적용 방안을 결정했습니다.',
        why: '팀 전체의 진행 상황을 동기화하고 이슈를 해결하기 위함',
        how: 'Zoom 온라인 회의, Notion 회의록 작성',
        status: '완료',
        resultSummary: '주간 진행 상황 공유 완료, 다음 주 일정 확정',
        evidenceLink: 'https://notion.so/weekly-meeting-notes'
    });
    
    // 이영희 활동
    LogService.create({
        title: 'API 서버 구축 및 배포',
        types: ['구현(코딩)'],
        date: getDate(13),
        startTime: '09:00',
        endTime: '17:00',
        taskScope: '서버 인프라',
        outputType: '코드',
        participants: [
            { memberId: member2.id, role: '백엔드 개발', contributionScore: 5, comment: 'Express 서버 구축', approved: true }
        ],
        whatIDid: 'Node.js와 Express를 사용하여 RESTful API 서버를 구축했습니다.\nPostgreSQL 데이터베이스를 연결하고 ORM을 설정했습니다.\nAWS EC2에 서버를 배포하고 도메인을 연결했습니다.',
        why: '프론트엔드와 통신할 백엔드 서버가 필요했습니다.',
        how: 'Node.js, Express, Sequelize ORM, PostgreSQL, AWS EC2',
        status: '완료',
        resultSummary: 'API 서버 구축 및 배포 완료, 기본 엔드포인트 구현',
        beforeAfter: '로컬 개발 환경 → AWS 프로덕션 환경',
        evidenceLink: 'https://github.com/example/api-server'
    });
    
    LogService.create({
        title: '인증 API 개발 및 테스트',
        types: ['구현(코딩)', '실험·테스트'],
        date: getDate(9),
        startTime: '10:00',
        endTime: '15:00',
        taskScope: '사용자 인증',
        outputType: '코드',
        participants: [
            { memberId: member2.id, role: '백엔드', contributionScore: 5, comment: 'JWT 인증 구현', approved: true }
        ],
        whatIDid: 'JWT 기반 인증 시스템을 구현했습니다.\n회원가입, 로그인, 토큰 갱신 API를 개발했습니다.\nPostman으로 API 테스트를 수행하고 문서화했습니다.',
        why: '사용자 인증 및 권한 관리가 필요했습니다.',
        how: 'JWT, bcrypt, Passport.js, Postman',
        status: '완료',
        resultSummary: '인증 API 완성, 테스트 및 문서화 완료',
        evidenceLink: 'https://github.com/example/auth-api'
    });
    
    // 박민수 활동
    LogService.create({
        title: 'UI/UX 디자인 시스템 구축',
        types: ['디자인'],
        date: getDate(14),
        startTime: '09:00',
        endTime: '18:00',
        taskScope: '전체',
        outputType: '이미지',
        participants: [
            { memberId: member3.id, role: '디자인', contributionScore: 5, comment: 'Figma 디자인 시스템 제작', approved: true }
        ],
        whatIDid: 'Figma를 사용하여 전체 프로젝트의 디자인 시스템을 구축했습니다.\n컬러 팔레트, 타이포그래피, 컴포넌트 라이브러리를 정의했습니다.\n개발팀과 공유할 수 있도록 스타일 가이드를 작성했습니다.',
        why: '일관된 UI/UX를 위한 디자인 시스템이 필요했습니다.',
        how: 'Figma, Material Design 참고',
        status: '완료',
        resultSummary: '디자인 시스템 완성, 개발팀과 공유',
        evidenceLink: 'https://figma.com/design-system'
    });
    
    LogService.create({
        title: '상품 상세 페이지 디자인',
        types: ['디자인'],
        date: getDate(6),
        startTime: '13:00',
        endTime: '17:00',
        taskScope: '상품 상세',
        outputType: '이미지',
        participants: [
            { memberId: member3.id, role: '디자인', contributionScore: 5, comment: 'Figma 목업 제작', approved: true }
        ],
        whatIDid: '상품 상세 페이지의 레이아웃과 UI를 디자인했습니다.\n이미지 갤러리, 상품 정보, 리뷰 섹션을 구성했습니다.\n모바일 반응형 디자인도 함께 제작했습니다.',
        why: '상품 상세 정보를 효과적으로 표시하기 위함',
        how: 'Figma, 참고 사이트 벤치마킹',
        status: '완료',
        resultSummary: '상품 상세 페이지 디자인 완성',
        evidenceLink: 'https://figma.com/product-detail'
    });
    
    // 정지원 활동
    LogService.create({
        title: '프로젝트 기획서 작성',
        types: ['문서·보고서'],
        date: getDate(15),
        startTime: '09:00',
        endTime: '12:00',
        taskScope: '전체',
        outputType: '문서',
        participants: [
            { memberId: member4.id, role: 'PM', contributionScore: 5, comment: '기획서 작성', approved: true }
        ],
        whatIDid: '프로젝트의 목표, 범위, 일정을 정리한 기획서를 작성했습니다.\n주요 기능 목록과 우선순위를 정의했습니다.\n팀원들과 공유하여 피드백을 받았습니다.',
        why: '프로젝트의 방향성과 목표를 명확히 하기 위함',
        how: 'Notion, Google Docs',
        status: '완료',
        resultSummary: '프로젝트 기획서 완성 및 팀 공유',
        evidenceLink: 'https://notion.so/project-plan'
    });
    
    LogService.create({
        title: '경쟁사 분석 및 벤치마킹',
        types: ['조사'],
        date: getDate(8),
        startTime: '14:00',
        endTime: '17:00',
        taskScope: '전체',
        outputType: '문서',
        participants: [
            { memberId: member4.id, role: '조사', contributionScore: 5, comment: '경쟁사 분석 보고서 작성', approved: true }
        ],
        whatIDid: '주요 경쟁 쇼핑몰 3곳의 기능과 UI를 분석했습니다.\n장단점을 정리하고 우리 프로젝트에 적용할 수 있는 아이디어를 도출했습니다.\n분석 결과를 보고서로 작성하여 팀과 공유했습니다.',
        why: '시장 트렌드를 파악하고 차별화 포인트를 찾기 위함',
        how: '경쟁사 웹사이트 분석, 스크린샷 수집',
        status: '완료',
        resultSummary: '경쟁사 분석 완료, 개선 아이디어 도출',
        evidenceLink: 'https://notion.so/competitor-analysis'
    });
    
    // 익명 평가 데모 데이터 추가
    const allLogs = LogService.getAll();
    const demoFeedbacks = [];
    
    // 로그 1: 로그인 페이지 UI 구현 - 김철수에 대한 평가
    if (allLogs.length > 0) {
        const log1 = allLogs.find(l => l.title.includes('로그인 페이지'));
        if (log1) {
            demoFeedbacks.push({
                id: 'fb_demo_' + Date.now() + '_1',
                targetType: 'LOG',
                targetId: log1.id,
                memberId: member1.id,
                text: 'UI 구현 퀄리티가 높고 반응형도 완벽했어요',
                createdAt: new Date(log1.date).getTime() + 3600000,
                isHidden: false
            });
        }
    }
    
    // 로그 2: 상품 목록 페이지 개발 - 김철수에 대한 평가
    if (allLogs.length > 1) {
        const log2 = allLogs.find(l => l.title.includes('상품 목록'));
        if (log2) {
            demoFeedbacks.push({
                id: 'fb_demo_' + Date.now() + '_2',
                targetType: 'LOG',
                targetId: log2.id,
                memberId: member1.id,
                text: '페이지네이션 로직이 깔끔하고 성능도 좋았습니다',
                createdAt: new Date(log2.date).getTime() + 7200000,
                isHidden: false
            });
            
            // 이영희에 대한 평가
            demoFeedbacks.push({
                id: 'fb_demo_' + Date.now() + '_3',
                targetType: 'LOG',
                targetId: log2.id,
                memberId: member2.id,
                text: 'API 연동이 빠르고 에러 처리도 꼼꼼했어요',
                createdAt: new Date(log2.date).getTime() + 10800000,
                isHidden: false
            });
        }
    }
    
    // 로그 3: 주간 회의 - 정지원에 대한 평가
    if (allLogs.length > 2) {
        const log3 = allLogs.find(l => l.title.includes('주간 회의'));
        if (log3) {
            demoFeedbacks.push({
                id: 'fb_demo_' + Date.now() + '_4',
                targetType: 'LOG',
                targetId: log3.id,
                memberId: member4.id,
                text: '회의 진행이 체계적이고 정리도 잘 해주셨어요',
                createdAt: new Date(log3.date).getTime() + 5400000,
                isHidden: false
            });
        }
    }
    
    // 로그 4: UI/UX 디자인 시스템 구축 - 박민수에 대한 평가
    if (allLogs.length > 5) {
        const log4 = allLogs.find(l => l.title.includes('디자인 시스템'));
        if (log4) {
            demoFeedbacks.push({
                id: 'fb_demo_' + Date.now() + '_5',
                targetType: 'LOG',
                targetId: log4.id,
                memberId: member3.id,
                text: '디자인 시스템 덕분에 개발이 훨씬 수월했습니다',
                createdAt: new Date(log4.date).getTime() + 14400000,
                isHidden: false
            });
        }
    }
    
    // 로그 5: 인증 API 개발 - 이영희에 대한 평가
    if (allLogs.length > 4) {
        const log5 = allLogs.find(l => l.title.includes('인증 API'));
        if (log5) {
            demoFeedbacks.push({
                id: 'fb_demo_' + Date.now() + '_6',
                targetType: 'LOG',
                targetId: log5.id,
                memberId: member2.id,
                text: '보안 처리가 탄탄하고 문서화도 잘 되어있어요',
                createdAt: new Date(log5.date).getTime() + 18000000,
                isHidden: false
            });
        }
    }
    
    // 기존 feedbacks와 병합
    const existingFeedbacks = FeedbackService.getAll();
    const mergedFeedbacks = [...existingFeedbacks, ...demoFeedbacks];
    FeedbackService.setAll(mergedFeedbacks);
    
    // 저장
    autoSave();
    
    // 익명 평가 UI 갱신
    if (typeof renderFeedbackLogOptions === 'function') renderFeedbackLogOptions();
    if (typeof renderFeedbackList === 'function') renderFeedbackList();
    if (typeof renderFeedbackPreview === 'function') renderFeedbackPreview();
    
    console.log(' 데모 데이터 로드 완료');
    console.log(`- 팀원: ${MemberService.getAll().length}명`);
    console.log(`- 로그: ${LogService.getAll().length}개`);
    console.log(`- 익명 평가: ${FeedbackService.getAll().length}개`);
}

function clearAllData() {
    resetState();
    ProjectService.init(''); // 빈 프로젝트명으로 초기화
    console.log(' 모든 데이터 초기화 완료');
}

// UI 연동 함수
function loadDemoDataUI() {
    const confirmed = confirm('샘플 데이터를 로드하시겠습니까?\n현재 데이터는 덮어씌워집니다.');
    if (!confirmed) return;
    
    loadDemoData();
    
    // UI 갱신
    if (typeof renderMembers === 'function') renderMembers();
    if (typeof renderTimeline === 'function') renderTimeline();
    
    // 프로젝트 이름 업데이트
    const projectNameInput = document.getElementById('projectName');
    if (projectNameInput) {
        projectNameInput.value = ProjectService.get().name;
    }
    
    // 저장
    autoSave();
    
    alert(' 샘플 데이터가 로드되었습니다!');
}

function clearAllDataUI() {
    const confirmed = confirm('모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
    if (!confirmed) return;
    
    // localStorage 완전 삭제
    localStorage.removeItem('teamContributionApp');
    
    // 메모리 상태 초기화
    resetState();
    ProjectService.init('');
    
    console.log('🗑️ 모든 데이터 초기화 완료 - 페이지를 새로고침합니다.');
    
    // 페이지 새로고침으로 완전 초기화
    location.reload();
}

// 콘솔에서 사용 가능하도록 전역 노출
window.loadDemoData = loadDemoData;
window.clearAllData = clearAllData;
window.loadDemoDataUI = loadDemoDataUI;
window.clearAllDataUI = clearAllDataUI;

// 검증용 헬퍼 함수
window.checkState = function() {
    console.log('%c=== 현재 상태 확인 ===', 'font-size: 14px; font-weight: bold; color: #007bff;');
    console.log('프로젝트:', ProjectService.get());
    console.log('팀원:', MemberService.getAll());
    console.log('로그:', LogService.getAll());
    console.log('요약:', SummaryService.getAll());
    console.log('localStorage:', localStorage.getItem('teamContributionApp') ? '데이터 있음' : '비어있음');
};

// 개발자 도구 안내 (자동 로드 없음)
console.log('%c 팀 기여도 로그 MVP', 'font-size: 14px; font-weight: bold; color: #007bff;');
console.log('%c샘플 데이터는 자동으로 로드되지 않습니다.', 'color: #666;');
console.log('%c테스트를 원하시면 아래 함수를 사용하세요:', 'color: #666;');
console.log('%c  loadDemoData()     - 샘플 데이터 로드', 'color: #28a745;');
console.log('%c  clearAllData()     - 모든 데이터 초기화', 'color: #dc3545;');
console.log('%c  checkState()       - 현재 상태 확인 (디버깅용)', 'color: #17a2b8;');
console.log('%c또는 화면의 " 샘플 데이터 로드" 버튼을 클릭하세요.', 'color: #666;');
