/**
 * AppState 구조 설계
 * 
 * 엔티티:
 * 1. Project - 프로젝트 메타데이터
 * 2. Member - 팀원 정보
 * 3. Log - 활동 로그
 * 4. Summary - 자동 생성 요약 (규칙 기반 집계)
 * 
 * 관계:
 * - Project 1 : N Member
 * - Member 1 : N Log
 * - Project 1 : N Log
 * - Project 1 : N Summary
 * 
 * DB 마이그레이션 시:
 * - 각 엔티티는 테이블로 변환
 * - id는 primary key
 * - projectId, memberId는 foreign key
 * - createdAt, updatedAt은 timestamp
 */

// 전역 상태 객체
const AppState = {
    // 프로젝트 (단일)
    project: {
        id: null,
        name: '',
        description: '',
        createdAt: null,
        updatedAt: null
    },
    
    // 팀원 목록
    members: [
        // {
        //     id: 'uuid',
        //     projectId: 'uuid',
        //     alias: '김철수',
        //     role: '개발자', // 기존 필드 (하위 호환)
        //     
        //     // 역할 추천용 프로필 (선택사항)
        //     profile: {
        //         majorType: 'ENGINEERING', // 'ENGINEERING' | 'DESIGN' | 'ART' | 'HUMANITIES'
        //         skills: ['DEV', 'DATA'], // 'DEV', 'DESIGN', 'PRESENT', 'DOCS', 'DATA'
        //         preferredRoles: ['DEV', 'DATA', 'PL'], // 최대 3개, 우선순위 순서
        //         avoidRole: 'PRESENT' // 1개 또는 null
        //     },
        //     decidedRole: 'DEV', // 팀 합의 역할 (null 가능)
        //     
        //     createdAt: '2024-01-01T00:00:00Z',
        //     updatedAt: '2024-01-01T00:00:00Z'
        // }
    ],
    
    // 활동 로그 목록
    logs: [
        // {
        //     id: 'uuid',
        //     projectId: 'uuid',
        //     
        //     // 기본 정보
        //     title: '로그인 기능 구현',
        //     types: ['구현(코딩)', '실험·테스트'],
        //     date: '2024-01-01',
        //     startTime: '09:00',
        //     endTime: '12:00',
        //     duration: 180, // 분 단위
        //     
        //     // 관련 범위
        //     taskScope: '2-3 데이터 수집',
        //     outputType: '코드',
        //     
        //     // 참여자 정보 (공동활동 대응)
        //     participants: [
        //         {
        //             memberId: 'uuid',
        //             role: '구현',
        //             contributionScore: 5,
        //             comment: '주요 로직 구현',
        //             approved: true
        //         }
        //     ],
        //     
        //     // 활동 내용
        //     whatIDid: '실제 수행 내용 (3~6줄)',
        //     why: '목적/배경 (선택)',
        //     how: '방법/도구 요약 (선택)',
        //     
        //     // 결과 / 증빙
        //     status: '완료', // 완료 / 부분완료 / 보류
        //     resultSummary: '결과 요약',
        //     beforeAfter: '변경점 (선택)',
        //     evidenceLink: 'https://github.com/...',
        //     evidenceFile: null,
        //     
        //     createdAt: '2024-01-01T00:00:00Z',
        //     updatedAt: '2024-01-01T00:00:00Z'
        // }
    ],
    
    // 요약 목록 (버전 관리 가능)
    summaries: [
        // {
        //     id: 'uuid',
        //     projectId: 'uuid',
        //     version: 1,
        //     status: 'DRAFT|APPROVED',
        //     content: { /* JSON 구조 */ },
        //     generatedAt: '2024-01-01T00:00:00Z',
        //     approvedAt: null,
        //     createdAt: '2024-01-01T00:00:00Z',
        //     updatedAt: '2024-01-01T00:00:00Z'
        // }
    ]
};

// ===== CRUD 헬퍼 함수 =====

// ID 생성 (UUID 대신 timestamp 사용)
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 현재 시간
function now() {
    return new Date().toISOString();
}

// ===== Project CRUD =====

const ProjectService = {
    init(name, description = '') {
        AppState.project = {
            id: generateId(),
            name,
            description,
            createdAt: now(),
            updatedAt: now()
        };
        return AppState.project;
    },
    
    get() {
        return AppState.project;
    },
    
    update(data) {
        AppState.project = {
            ...AppState.project,
            ...data,
            updatedAt: now()
        };
        return AppState.project;
    }
};

// ===== Member CRUD =====

const MemberService = {
    create(alias, role, profile = null) {
        const member = {
            id: generateId(),
            projectId: AppState.project.id,
            alias,
            role: role || '', // 기존 필드 (하위 호환, 빈 문자열 가능)
            profile: profile || {
                majorType: 'ENGINEERING',
                skills: [],
                preferredRoles: [],
                avoidRole: null
            }, // 역할 추천용 프로필 (항상 생성)
            decidedRole: null, // 팀 합의 역할
            createdAt: now(),
            updatedAt: now()
        };
        AppState.members.push(member);
        return member;
    },
    
    getAll() {
        return AppState.members;
    },
    
    getById(id) {
        return AppState.members.find(m => m.id === id);
    },
    
    update(id, data) {
        const index = AppState.members.findIndex(m => m.id === id);
        if (index === -1) return null;
        
        AppState.members[index] = {
            ...AppState.members[index],
            ...data,
            updatedAt: now()
        };
        return AppState.members[index];
    },
    
    delete(id) {
        const index = AppState.members.findIndex(m => m.id === id);
        if (index === -1) return false;
        
        AppState.members.splice(index, 1);
        return true;
    },
    
    deleteAll() {
        AppState.members = [];
        return true;
    }
};

// ===== Log CRUD =====

const LogService = {
    create(logData) {
        // duration 자동 계산
        let duration = 0;
        if (logData.startTime && logData.endTime) {
            const [startH, startM] = logData.startTime.split(':').map(Number);
            const [endH, endM] = logData.endTime.split(':').map(Number);
            duration = (endH * 60 + endM) - (startH * 60 + startM);
        }
        
        const log = {
            id: generateId(),
            projectId: AppState.project.id,
            
            // 기본 정보
            title: logData.title,
            types: logData.types || [],
            date: logData.date,
            startTime: logData.startTime || '',
            endTime: logData.endTime || '',
            duration,
            
            // 관련 범위
            taskScope: logData.taskScope || '',
            outputType: logData.outputType || '',
            
            // 참여자 정보
            participants: logData.participants || [],
            
            // 활동 내용
            whatIDid: logData.whatIDid,
            why: logData.why || '',
            how: logData.how || '',
            
            // 결과 / 증빙
            status: logData.status || '완료',
            resultSummary: logData.resultSummary || '',
            beforeAfter: logData.beforeAfter || '',
            evidenceLink: logData.evidenceLink || '',
            evidenceFile: logData.evidenceFile || null,
            
            createdAt: now(),
            updatedAt: now()
        };
        
        AppState.logs.push(log);
        return log;
    },
    
    getAll() {
        return AppState.logs;
    },
    
    getById(id) {
        return AppState.logs.find(l => l.id === id);
    },
    
    getByMemberId(memberId) {
        return AppState.logs.filter(l => 
            l.participants.some(p => p.memberId === memberId)
        );
    },
    
    update(id, data) {
        const index = AppState.logs.findIndex(l => l.id === id);
        if (index === -1) return null;
        
        AppState.logs[index] = {
            ...AppState.logs[index],
            ...data,
            updatedAt: now()
        };
        return AppState.logs[index];
    },
    
    delete(id) {
        const index = AppState.logs.findIndex(l => l.id === id);
        if (index === -1) return false;
        
        AppState.logs.splice(index, 1);
        return true;
    },
    
    deleteAll() {
        AppState.logs = [];
        return true;
    }
};

// ===== 익명 평가(피드백) 서비스 =====
const FeedbackService = (() => {
    let feedbacks = [];
    
    function _id() {
        return 'fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }
    
    // 아주 최소 금칙어(원하면 확장 가능)
    const banned = ['시발', '씨발', '병신', 'ㅂㅅ', '존나', '좆', 'fuck', 'asshole'];
    function sanitizeText(input) {
        let text = (input || '').trim();
        // 길이 제한: 5~60자
        if (text.length < 5) return { ok: false, reason: '5자 이상 입력해주세요.' };
        if (text.length > 60) return { ok: false, reason: '60자 이내로 입력해주세요.' };
        
        // 금칙어 마스킹
        for (const w of banned) {
            const re = new RegExp(w, 'gi');
            text = text.replace(re, '***');
        }
        return { ok: true, text };
    }
    
    // 간단 중복 방지: 같은 브라우저에서 같은 로그에 10분 내 연속 제출 제한
    function canSubmit(targetId) {
        const key = `fb.cooldown.${targetId}`;
        const last = Number(localStorage.getItem(key) || 0);
        const now = Date.now();
        if (now - last < 10 * 60 * 1000) return false;
        localStorage.setItem(key, String(now));
        return true;
    }
    
    function setAll(list) {
        feedbacks = Array.isArray(list) ? list : [];
    }
    
    function getAll() {
        return feedbacks;
    }
    
    function createForLog(logId, memberId, text) {
        if (!logId) return { ok: false, message: '평가할 활동을 선택해주세요.' };
        if (!memberId) return { ok: false, message: '평가할 팀원을 선택해주세요.' };
        
        const clean = sanitizeText(text);
        if (!clean.ok) return { ok: false, message: clean.reason };
        
        if (!canSubmit(logId)) {
            return { ok: false, message: '잠시 후 다시 제출해주세요. (연속 제출 제한)' };
        }
        
        const fb = {
            id: _id(),
            targetType: 'LOG',
            targetId: logId,
            memberId: memberId,
            text: clean.text,
            createdAt: Date.now(),
            isHidden: false
        };
        
        feedbacks.push(fb);
        return { ok: true, feedback: fb };
    }
    
    function listForLog(logId) {
        return feedbacks
            .filter(f => f.targetType === 'LOG' && f.targetId === logId && !f.isHidden)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    
    function listAll() {
        return feedbacks
            .filter(f => f.targetType === 'LOG' && !f.isHidden)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    
    function statsForLog(logId) {
        const list = listForLog(logId);
        return {
            count: list.length
        };
    }
    
    return { setAll, getAll, createForLog, listForLog, listAll, statsForLog };
})();

// ===== Summary CRUD =====

const SummaryService = {
    create(content) {
        // 버전 계산 (기존 요약 개수 + 1)
        const version = AppState.summaries.length + 1;
        
        const summary = {
            id: generateId(),
            projectId: AppState.project.id,
            version,
            status: 'DRAFT',
            content,
            generatedAt: now(),
            approvedAt: null,
            createdAt: now(),
            updatedAt: now()
        };
        AppState.summaries.push(summary);
        return summary;
    },
    
    getAll() {
        return AppState.summaries;
    },
    
    getLatest() {
        if (AppState.summaries.length === 0) return null;
        return AppState.summaries[AppState.summaries.length - 1];
    },
    
    getById(id) {
        return AppState.summaries.find(s => s.id === id);
    },
    
    approve(id) {
        const index = AppState.summaries.findIndex(s => s.id === id);
        if (index === -1) return null;
        
        AppState.summaries[index] = {
            ...AppState.summaries[index],
            status: 'APPROVED',
            approvedAt: now(),
            updatedAt: now()
        };
        return AppState.summaries[index];
    },
    
    delete(id) {
        const index = AppState.summaries.findIndex(s => s.id === id);
        if (index === -1) return false;
        
        AppState.summaries.splice(index, 1);
        return true;
    },
    
    deleteAll() {
        AppState.summaries = [];
        return true;
    }
};

// ===== 데이터 초기화 & 내보내기 =====

function resetState() {
    AppState.project = {
        id: null,
        name: '',
        description: '',
        createdAt: null,
        updatedAt: null
    };
    AppState.members = [];
    AppState.logs = [];
    AppState.summaries = [];
}

function clearAllData() {
    resetState();
    ProjectService.init(''); // 빈 프로젝트명으로 초기화
    
    // localStorage도 초기화
    localStorage.removeItem('teamContributionApp');
    
    console.log(' 모든 데이터 초기화 완료');
}

// localStorage 저장/로드 (선택사항)
function saveToLocalStorage() {
    try {
        const data = {
            project: AppState.project,
            members: AppState.members,
            logs: AppState.logs,
            summaries: AppState.summaries,
            feedbacks: FeedbackService.getAll()
        };
        localStorage.setItem('teamContributionApp', JSON.stringify(data));
        console.log(' 데이터 저장 완료');
        return true;
    } catch (error) {
        console.error(' 저장 실패:', error);
        return false;
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('teamContributionApp');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(AppState, {
                project: data.project,
                members: data.members,
                logs: data.logs,
                summaries: data.summaries
            });
            
            // feedbacks 로드
            FeedbackService.setAll(Array.isArray(data.feedbacks) ? data.feedbacks : []);
            
            console.log(' 데이터 로드 완료');
            return true;
        }
        return false;
    } catch (error) {
        console.error(' 로드 실패:', error);
        return false;
    }
}

// 자동 저장 (변경 시마다)
function autoSave() {
    saveToLocalStorage();
}
