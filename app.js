// ===== 공통 헬퍼 함수 =====

/**
 * 역할 확정 여부 판정 (전역 기준)
 * @param {Object} member - 팀원 객체
 * @returns {boolean} 역할이 확정되었으면 true
 */
function isRoleDecided(member) {
    return typeof member.decidedRole === 'string' && member.decidedRole.trim().length > 0;
}

// ===== 초기화 =====

// 활성 섹션 관리
function setActiveSection(sectionId) {
    // 모든 섹션에서 is-active 제거
    document.querySelectorAll('.section-card')
        .forEach(el => el.classList.remove('is-active'));
    
    // 지정된 섹션에 is-active 추가
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('is-active');
    }
}

// 활성 섹션 제거
function clearActiveSection() {
    document.querySelectorAll('.section-card')
        .forEach(el => el.classList.remove('is-active'));
}

// 섹션 토글 (아코디언)
function toggleSection(key) {
    const body = document.getElementById(`sectionBody-${key}`);
    const btn = document.getElementById(`toggleBtn-${key}`);
    const preview = document.getElementById(`sectionPreview-${key}`);
    
    const collapsed = body.classList.toggle('is-collapsed');
    btn.textContent = collapsed ? '▼' : '▲';
    btn.setAttribute('aria-expanded', String(!collapsed));
    
    // 타임라인/익명평가는 접힘이면 preview 보이고, 열림이면 숨김
    if (preview) {
        if (collapsed) {
            preview.classList.remove('is-hidden');
        } else {
            preview.classList.add('is-hidden');
        }
    }
    
    // 섹션이 열릴 때 활성화
    if (!collapsed) {
        const sectionId = key === 'member' ? 'memberSection' 
                        : key === 'timeline' ? 'timelineSection'
                        : key === 'feedback' ? 'feedbackSection'
                        : null;
        if (sectionId) setActiveSection(sectionId);
    } else {
        clearActiveSection();
    }
    
    localStorage.setItem(`ui.section.${key}`, collapsed ? 'collapsed' : 'open');
}

// 섹션 초기 상태 설정
function initSectionState(key, defaultState = 'open') {
    const saved = localStorage.getItem(`ui.section.${key}`) || defaultState;
    const body = document.getElementById(`sectionBody-${key}`);
    const btn = document.getElementById(`toggleBtn-${key}`);
    const preview = document.getElementById(`sectionPreview-${key}`);
    
    const collapsed = saved === 'collapsed';
    if (collapsed) {
        body.classList.add('is-collapsed');
    } else {
        body.classList.remove('is-collapsed');
    }
    
    btn.textContent = collapsed ? '▼' : '▲';
    btn.setAttribute('aria-expanded', String(!collapsed));
    
    if (preview) {
        if (collapsed) {
            preview.classList.remove('is-hidden');
        } else {
            preview.classList.add('is-hidden');
        }
    }
}

// 타임라인 미리보기 렌더 (최근 2개)
function renderTimelinePreview() {
    const preview = document.getElementById('sectionPreview-timeline');
    if (!preview) return;
    
    const logs = LogService.getAll();
    if (!logs || logs.length === 0) {
        preview.innerHTML = '<div style="color:#999;">활동 로그가 없습니다.</div>';
        return;
    }
    
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const top2 = sorted.slice(0, 2);
    
    preview.innerHTML = top2.map(log => {
        const type = (log.types && log.types[0]) ? log.types[0] : '활동';
        return `
            <div class="preview-item">
                <div class="preview-title">${log.title}</div>
                <div class="preview-meta">${log.date} · ${type}</div>
            </div>
        `;
    }).join('');
}

// 초기화
function init() {
    // 디버깅: localStorage 상태 확인
    const storageData = localStorage.getItem('teamContributionApp');
    if (storageData) {
        console.log('%c� localStorage에 저장된 데이터 발견', 'color: #ff9800; font-weight: bold;');
        console.log('   데이터를 로드합니다. 완전히 초기화하려면 "�️ 전체 초기화" 버튼을 클릭하세요.');
    } else {
        console.log('%c localStorage 비어있음', 'color: #666;');
    }
    
    // localStorage에서 데이터 로드 시도
    const loaded = loadFromLocalStorage();
    
    if (!loaded) {
        // 로드 실패 시 완전히 빈 상태로 초기화
        ProjectService.init('');
        console.log('%c 새로운 프로젝트 시작', 'color: #007bff; font-weight: bold;');
        console.log('%c   - 프로젝트명, 팀원, 로그 모두 빈 상태입니다.', 'color: #666;');
        console.log('%c   - 샘플 데이터를 원하시면 " 샘플 데이터 로드" 버튼을 클릭하세요.', 'color: #666;');
    } else {
        console.log('%c 저장된 데이터 로드 완료', 'color: #28a745; font-weight: bold;');
        
        // 기존 데이터 정규화
        const members = MemberService.getAll();
        let fixedCount = 0;
        
        members.forEach(member => {
            // profile이 없는 팀원 보완
            if (!member.profile) {
                member.profile = {
                    majorType: 'ENGINEERING',
                    skills: [],
                    preferredRoles: [],
                    avoidRole: null
                };
                fixedCount++;
            }
            
            // decidedRole 정규화: undefined → null
            if (member.decidedRole === undefined) {
                member.decidedRole = null;
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            console.log(`%c ${fixedCount}개 항목 정규화 완료`, 'color: #ffc107; font-weight: bold;');
            autoSave(); // 정규화된 데이터 저장
        }
        
        const logs = LogService.getAll();
        console.log(`   - 팀원: ${members.length}명, 로그: ${logs.length}개`);
    }
    
    // 프로젝트 이름 입력 이벤트
    const projectNameInput = document.getElementById('projectName');
    projectNameInput.value = ProjectService.get().name;
    projectNameInput.addEventListener('change', (e) => {
        ProjectService.update({ name: e.target.value });
        autoSave();
    });
    
    // 프로젝트 정보 섹션 활성화 (focus 시)
    projectNameInput.addEventListener('focus', () => {
        setActiveSection('projectSection');
    });
    projectNameInput.addEventListener('blur', () => {
        clearActiveSection();
    });
    
    // 오늘 날짜 기본값
    document.getElementById('logDate').valueAsDate = new Date();
    
    // 시간 입력 이벤트 (duration 계산)
    document.getElementById('logStartTime').addEventListener('change', updateDuration);
    document.getElementById('logEndTime').addEventListener('change', updateDuration);
    
    // 아코디언 섹션 초기 상태 설정
    initSectionState('member', 'collapsed');      // 팀원 관리: 기본 접힘
    initSectionState('feedback', 'collapsed');    // 익명 평가: 기본 접힘
    initSectionState('timeline', 'collapsed');    // 활동 타임라인: 기본 접힘
    
    // 익명 평가 섹션 - 활동 선택 시 팀원 옵션 업데이트
    const fbLogSelect = document.getElementById('fbTargetLog');
    if (fbLogSelect) {
        fbLogSelect.addEventListener('change', (e) => {
            updateFeedbackMemberOptionsByLog(e.target.value);
        });
    }
    
    // 팀원 관리 섹션 활성화 (입력 필드 focus 시)
    const memberInputs = ['memberAlias', 'memberMajorType', 'memberPreferred1', 'memberPreferred2', 'memberPreferred3', 'memberAvoidRole'];
    memberInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('focus', () => setActiveSection('memberSection'));
            input.addEventListener('blur', () => {
                // 다른 팀원 입력 필드로 포커스가 이동하지 않았을 때만 제거
                setTimeout(() => {
                    const activeElement = document.activeElement;
                    const isMemberInput = memberInputs.some(id => document.getElementById(id) === activeElement);
                    if (!isMemberInput) {
                        clearActiveSection();
                    }
                }, 100);
            });
        }
    });
    
    renderMembers();
    renderTimeline();
    renderTimelinePreview();
    renderFeedbackPreview();
    renderFeedbackLogOptions();
    updateFeedbackMemberOptionsByLog(document.getElementById('fbTargetLog')?.value);
    renderFeedbackList();
}

// 로그 폼 토글
function toggleLogForm() {
    const container = document.getElementById('logFormContainer');
    const btn = document.getElementById('toggleLogFormBtn');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.textContent = '- 폼 닫기';
        renderParticipants();
        // 로그 입력 섹션 활성화
        setActiveSection('logInputSection');
    } else {
        container.style.display = 'none';
        btn.textContent = '+ 새 활동 로그 추가';
        document.getElementById('logForm').reset();
        // 활성 섹션 제거
        clearActiveSection();
    }
}

// Duration 계산 및 표시
function updateDuration() {
    const startTime = document.getElementById('logStartTime').value;
    const endTime = document.getElementById('logEndTime').value;
    const display = document.getElementById('durationDisplay');
    
    if (startTime && endTime) {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        
        if (duration > 0) {
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            display.textContent = `(${hours}시간 ${minutes}분)`;
        } else {
            display.textContent = '(시간 오류)';
        }
    } else {
        display.textContent = '';
    }
}

// 참여자 목록 렌더링
function renderParticipants() {
    const container = document.getElementById('participantsContainer');
    const members = MemberService.getAll();
    
    if (members.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 12px;">팀원을 먼저 추가해주세요.</p>';
        return;
    }
    
    // 기본 참여자 1명 추가
    if (container.children.length === 0) {
        addParticipant();
    }
}

// 참여자 추가
let participantCount = 0;
function addParticipant() {
    const container = document.getElementById('participantsContainer');
    const members = MemberService.getAll();
    
    if (members.length === 0) {
        alert('팀원을 먼저 추가해주세요.');
        return;
    }
    
    const id = participantCount++;
    const card = document.createElement('div');
    card.className = 'participant-card';
    card.id = `participant-${id}`;
    
    card.innerHTML = `
        <select class="participant-member" required>
            <option value="">팀원 선택</option>
            ${members.map(m => `<option value="${m.id}">${m.alias}</option>`).join('')}
        </select>
        <input type="text" class="participant-role" placeholder="역할 (예: 구현)" required>
        <select class="participant-score" required>
            <option value="" disabled selected>기여도 점수</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
        </select>
        <input type="text" class="participant-comment" placeholder="기여 설명">
        <button type="button" onclick="removeParticipant(${id})">삭제</button>
    `;
    
    container.appendChild(card);
}

// 참여자 제거
function removeParticipant(id) {
    const card = document.getElementById(`participant-${id}`);
    if (card) card.remove();
}

// ===== Screen A: 프로젝트 대시보드 =====

// 팀원 추가
function addMember() {
    const alias = document.getElementById('memberAlias').value.trim();
    const majorType = document.getElementById('memberMajorType').value;
    const preferred1 = document.getElementById('memberPreferred1').value;
    const preferred2 = document.getElementById('memberPreferred2').value;
    const preferred3 = document.getElementById('memberPreferred3').value;
    const avoidRole = document.getElementById('memberAvoidRole').value || null;
    
    if (!alias) {
        alert('이름을 입력해주세요.');
        return;
    }
    
    if (!majorType) {
        alert('학과를 선택해주세요.');
        return;
    }
    
    if (!preferred1) {
        alert('선호 역할 1순위를 선택해주세요.');
        return;
    }
    
    // 선호 역할 배열 생성 (빈 값 제외)
    const preferredRoles = [preferred1];
    if (preferred2) preferredRoles.push(preferred2);
    if (preferred3) preferredRoles.push(preferred3);
    
    // 중복 체크
    const uniqueRoles = new Set(preferredRoles);
    if (uniqueRoles.size !== preferredRoles.length) {
        alert('선호 역할이 중복되었습니다. 서로 다른 역할을 선택해주세요.');
        return;
    }
    
    // 선호 역할과 비선호 역할 충돌 체크
    if (avoidRole && preferredRoles.includes(avoidRole)) {
        alert('선호 역할과 비선호 역할이 같을 수 없습니다.');
        return;
    }
    
    // 프로필 생성
    const profile = {
        majorType,
        skills: [], // 초기값은 빈 배열
        preferredRoles,
        avoidRole
    };
    
    // 팀원 생성 (role 없이, profile과 decidedRole만)
    MemberService.create(alias, '', profile);
    
    // 폼 초기화
    document.getElementById('memberAlias').value = '';
    document.getElementById('memberMajorType').value = '';
    document.getElementById('memberPreferred1').value = '';
    document.getElementById('memberPreferred2').value = '';
    document.getElementById('memberPreferred3').value = '';
    document.getElementById('memberAvoidRole').value = '';
    
    renderMembers();
    renderFeedbackMemberOptions();
    autoSave();
}

// 팀원 목록 렌더링
function renderMembers() {
    const memberList = document.getElementById('memberList');
    const logMemberSelect = document.getElementById('logMember');
    
    const members = MemberService.getAll();
    
    if (members.length === 0) {
        memberList.innerHTML = '<p style="color: #999; font-size: 14px;">팀원을 추가해주세요.</p>';
        if (logMemberSelect) {
            logMemberSelect.innerHTML = '<option value="">팀원 선택</option>';
        }
        return;
    }
    
    // 학과 이름 매핑
    const majorNames = {
        'ENGINEERING': '공학',
        'DESIGN': '디자인',
        'ART': '문예체능',
        'HUMANITIES': '인문/사회'
    };
    
    // 역할 이름 매핑
    const roleNames = {
        'PL': '기획/총괄',
        'DEV': '개발',
        'DESIGN': '디자인',
        'PRESENT': '발표',
        'DOCS': '문서',
        'DATA': '데이터/분석'
    };
    
    // 팀원 목록 표시
    memberList.innerHTML = `
        <div class="member-grid">
            ${members.map(m => {
                const majorName = m.profile ? majorNames[m.profile.majorType] || m.profile.majorType : '미설정';
                const preferred = m.profile && m.profile.preferredRoles.length > 0
                    ? m.profile.preferredRoles.map(r => roleNames[r] || r).join(', ')
                    : '미설정';
                
                // 확정된 역할 표시 (공통 헬퍼 사용)
                const decidedRoleHTML = isRoleDecided(m)
                    ? `<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                         확정: ${roleNames[m.decidedRole] || m.decidedRole}
                       </span>`
                    : `<span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                         미확정
                       </span>`;
                
                return `
                <div class="member-card">
                    <div>
                        <strong>${m.alias}</strong>
                        ${decidedRoleHTML}
                        <div style="color: #666; font-size: 12px; margin-top: 4px;">
                            ${majorName} | 선호: ${preferred}
                        </div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
    
    // 로그 입력용 셀렉트 업데이트 (존재하는 경우만)
    if (logMemberSelect) {
        logMemberSelect.innerHTML = '<option value="">팀원 선택</option>' + 
            members.map(m => `<option value="${m.id}">${m.alias}</option>`).join('');
    }
}

// 로그 추가
function addLog(event) {
    event.preventDefault();
    
    // 기본 정보
    const title = document.getElementById('logTitle').value.trim();
    const date = document.getElementById('logDate').value;
    const startTime = document.getElementById('logStartTime').value;
    const endTime = document.getElementById('logEndTime').value;
    
    // 활동 유형 (체크박스)
    const typeCheckboxes = document.querySelectorAll('input[name="logTypes"]:checked');
    const types = Array.from(typeCheckboxes).map(cb => cb.value);
    
    if (types.length === 0) {
        alert('활동 유형을 최소 1개 선택해주세요.');
        return;
    }
    
    if (types.length > 2) {
        alert('활동 유형은 최대 2개까지 선택 가능합니다.');
        return;
    }
    
    // 관련 범위
    const taskScope = document.getElementById('logTaskScope').value.trim();
    const outputType = document.getElementById('logOutputType').value;
    
    // 참여자 정보
    const participantCards = document.querySelectorAll('.participant-card');
    const participants = [];
    
    for (const card of participantCards) {
        const memberId = card.querySelector('.participant-member').value;
        const role = card.querySelector('.participant-role').value.trim();
        const score = parseInt(card.querySelector('.participant-score').value) || 5;
        const comment = card.querySelector('.participant-comment').value.trim();
        
        if (memberId && role) {
            participants.push({
                memberId,
                role,
                contributionScore: score,
                comment,
                approved: true // 기본값
            });
        }
    }
    
    if (participants.length === 0) {
        alert('최소 1명의 참여자를 추가해주세요.');
        return;
    }
    
    // 활동 내용
    const whatIDid = document.getElementById('logWhatIDid').value.trim();
    const why = document.getElementById('logWhy').value.trim();
    const how = document.getElementById('logHow').value.trim();
    
    // 결과 및 증빙
    const status = document.getElementById('logStatus').value;
    const resultSummary = document.getElementById('logResultSummary').value.trim();
    const beforeAfter = document.getElementById('logBeforeAfter').value.trim();
    const evidenceLink = document.getElementById('logEvidenceLink').value.trim();
    
    // 로그 생성
    const logData = {
        title,
        types,
        date,
        startTime,
        endTime,
        taskScope,
        outputType,
        participants,
        whatIDid,
        why,
        how,
        status,
        resultSummary,
        beforeAfter,
        evidenceLink
    };
    
    LogService.create(logData);
    
    // 폼 초기화
    document.getElementById('logForm').reset();
    toggleLogForm();
    
    renderTimeline();
    renderFeedbackLogOptions();
    autoSave();
}

// XSS 방지용 helper
function escapeHTML(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// 익명 평가 섹션 렌더링
function renderFeedbackSection(logId) {
    const stats = FeedbackService.statsForLog(logId);
    const members = MemberService.getAll();
    
    return `
        <div class="detail-section">
            <div class="detail-label">익명 한줄 평가</div>
            
            <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px; flex-wrap:wrap;">
                <span style="font-size:12px; color:#374151;">
                    총 <b>${stats.count}</b>개
                </span>
                <button type="button" class="mini-btn" onclick="toggleFeedbackForm('${logId}')">+ 평가 작성</button>
                <button type="button" class="mini-btn" onclick="toggleFeedbackList('${logId}')">목록 보기</button>
            </div>
            
            <div id="fb-form-${logId}" style="display:none; border:1px solid #e5e7eb; border-radius:8px; padding:10px; background:#fff; margin-bottom:10px;">
                <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap;">
                    <select id="fb-member-${logId}" style="padding:8px 10px; border:1px solid #ddd; border-radius:6px; font-size:12px; min-width:120px;">
                        <option value="">팀원 선택</option>
                        ${members.map(m => `<option value="${m.id}">${m.alias}</option>`).join('')}
                    </select>
                    <input id="fb-text-${logId}" type="text" placeholder="익명 한줄(5~60자)"
                        style="flex:1; min-width:200px; padding:8px 10px; border:1px solid #ddd; border-radius:6px; font-size:12px;" />
                    <button type="button" class="mini-btn primary" onclick="submitFeedback('${logId}')">등록</button>
                </div>
                <div style="font-size:11px; color:#6b7280;">
                    · 실명/비방/민감정보는 입력하지 마세요. · 연속 제출은 제한됩니다.
                </div>
            </div>
            
            <div id="fb-list-${logId}" style="display:none; margin-top:10px;"></div>
        </div>
    `;
}

// 익명 평가 폼 토글
function toggleFeedbackForm(logId) {
    const el = document.getElementById(`fb-form-${logId}`);
    if (!el) return;
    el.style.display = (el.style.display === 'none' || !el.style.display) ? 'block' : 'none';
}

// 익명 평가 목록 토글
function toggleFeedbackList(logId) {
    const el = document.getElementById(`fb-list-${logId}`);
    if (!el) return;
    
    const isHidden = (el.style.display === 'none' || !el.style.display);
    if (isHidden) {
        renderFeedbackList(logId);
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

// 익명 평가 목록 렌더링
function renderFeedbackList(logId) {
    const el = document.getElementById(`fb-list-${logId}`);
    if (!el) return;
    
    const list = FeedbackService.listForLog(logId);
    if (list.length === 0) {
        el.innerHTML = `<div style="font-size:12px; color:#9ca3af; padding:10px; text-align:center;">아직 평가가 없습니다.</div>`;
        return;
    }
    
    el.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${list.slice(0, 10).map(f => {
                const date = new Date(f.createdAt).toLocaleString('ko-KR');
                const member = MemberService.getById(f.memberId);
                const memberName = member ? member.alias : '익명';
                return `
                    <div style="border:1px solid #eef2f7; background:#fff; border-radius:8px; padding:10px;">
                        <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:4px;">
                            <div style="font-size:12px; font-weight:700; color:#111;">
                                ${escapeHTML(memberName)}
                            </div>
                            <div style="font-size:11px; color:#6b7280;">${date}</div>
                        </div>
                        <div style="font-size:12px; color:#374151;">${escapeHTML(f.text)}</div>
                    </div>
                `;
            }).join('')}
            ${list.length > 10 ? `<div style="font-size:11px; color:#6b7280; text-align:center;">최근 10개만 표시됩니다.</div>` : ''}
        </div>
    `;
}

// 익명 평가 제출
function submitFeedback(logId) {
    const memberSelect = document.getElementById(`fb-member-${logId}`);
    const input = document.getElementById(`fb-text-${logId}`);
    if (!input || !memberSelect) return;
    
    const memberId = memberSelect.value;
    const text = input.value;
    
    if (!memberId) {
        alert('평가할 팀원을 선택해주세요.');
        return;
    }
    
    const res = FeedbackService.createForLog(logId, memberId, text);
    if (!res.ok) {
        alert(res.message);
        return;
    }
    
    input.value = '';
    memberSelect.value = '';
    
    if (typeof autoSave === 'function') autoSave();
    renderTimeline();
    
    // 성공 메시지
    alert('평가가 등록되었습니다.');
}

// 익명 평가 섹션 - 팀원 선택 옵션 렌더
function renderFeedbackMemberOptions() {
    const sel = document.getElementById('fbTargetMember');
    if (!sel) return;
    const members = MemberService.getAll();
    sel.innerHTML = '<option value="">평가할 팀원 선택</option>' +
        members.map(m => `<option value="${m.id}">${m.alias}</option>`).join('');
}

// 멤버 키 추출 헬퍼 (일관성 보장)
function getMemberKey(m) {
    return m.id ?? m.memberId ?? m.uid ?? m._id;
}

// 활동 선택 시 참여자 기반으로 팀원 옵션 필터링
function updateFeedbackMemberOptionsByLog(logId) {
    const memberSelect = document.getElementById('fbTargetMember');
    if (!memberSelect) return;
    
    // 초기화
    memberSelect.innerHTML = '<option value="">평가할 팀원 선택</option>';
    memberSelect.disabled = true;
    
    if (!logId) return;
    
    const log = LogService.getAll().find(l => l.id === logId);
    if (!log || !Array.isArray(log.participants)) return;
    
    // 참여자 memberId 목록
    const participantIds = log.participants
        .map(p => p.memberId)
        .filter(Boolean);
    
    // 중복 제거
    const uniqueIds = Array.from(new Set(participantIds));
    
    // MemberService에서 실제 멤버 매핑
    const members = MemberService.getAll();
    const memberMap = new Map(members.map(m => [String(getMemberKey(m)), m]));
    
    const options = uniqueIds
        .map(id => memberMap.get(String(id)))
        .filter(Boolean);
    
    if (options.length === 0) return;
    
    memberSelect.innerHTML =
        '<option value="">평가할 팀원 선택</option>' +
        options.map(m => `<option value="${getMemberKey(m)}">${m.alias}</option>`).join('');
    
    memberSelect.disabled = false;
    
    // 팀원 선택값 초기화
    memberSelect.value = '';
}

// 익명 평가 섹션 - 로그 선택 옵션 렌더
function renderFeedbackLogOptions() {
    const select = document.getElementById('fbTargetLog');
    if (!select) return;
    
    const logs = LogService.getAll();
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    select.innerHTML = '<option value="">평가할 활동 선택</option>' + sorted.map(log => {
        const type = (log.types && log.types[0]) ? log.types[0] : '활동';
        return `<option value="${log.id}">${log.date} · ${type} · ${log.title}</option>`;
    }).join('');
    
    // 현재 선택된 log 기준으로 팀원 옵션 갱신
    const currentLogId = select.value;
    updateFeedbackMemberOptionsByLog(currentLogId);
}

// 익명 평가 섹션 - 제출
function submitAnonymousFeedback() {
    const logId = document.getElementById('fbTargetLog')?.value;
    const memberId = document.getElementById('fbTargetMember')?.value;
    const text = document.getElementById('fbText')?.value;
    
    if (!logId) {
        alert('평가할 활동을 선택해주세요.');
        return;
    }
    
    if (!memberId) {
        alert('평가할 팀원을 선택해주세요.');
        return;
    }
    
    const res = FeedbackService.createForLog(logId, memberId, text);
    if (!res.ok) {
        alert(res.message);
        return;
    }
    
    document.getElementById('fbText').value = '';
    document.getElementById('fbTargetLog').value = '';
    document.getElementById('fbTargetMember').value = '';
    document.getElementById('fbTargetMember').disabled = true;
    
    // 저장 (feedbacks 포함)
    autoSave();
    
    // 즉시 UI 갱신
    renderFeedbackList();
    renderFeedbackPreview();
    renderTimeline(); // 타임라인 내 평가 카운트도 업데이트
    
    // 접혀있으면 자동으로 펼쳐서 사용자가 "등록됨"을 바로 보게
    const body = document.getElementById('sectionBody-feedback');
    if (body && body.classList.contains('is-collapsed')) {
        toggleSection('feedback');
    }
    
    // 리스트 영역 자동 펼치기
    const wrapper = document.getElementById('feedbackListWrapper');
    const btn = document.getElementById('fbListToggleBtn');
    if (wrapper && btn && wrapper.style.display === 'none') {
        wrapper.style.display = 'block';
        btn.textContent = '목록 숨기기';
    }
    
    alert('평가가 등록되었습니다.');
}

// 익명 평가 섹션 - 리스트 렌더 (전체)
function renderFeedbackList() {
    const container = document.getElementById('feedbackList');
    const countHint = document.getElementById('fbCountHint');
    if (!container) return;
    
    const all = FeedbackService.listAll();
    
    // 카운트 힌트 업데이트
    if (countHint) {
        countHint.textContent = `총 ${all.length}개의 익명 평가`;
    }
    
    if (all.length === 0) {
        container.innerHTML = `<div style="font-size:13px; color:#9ca3af; padding:20px; text-align:center;">아직 익명 평가가 없습니다.</div>`;
        return;
    }
    
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${all.map(f => {
                const member = MemberService.getById(f.memberId);
                const memberName = member ? member.alias : '(알 수 없음)';
                const log = LogService.getAll().find(l => l.id === f.targetId);
                const title = log ? log.title : '(삭제된 활동)';
                const meta = log ? `${log.date}` : '';
                const date = new Date(f.createdAt).toLocaleString('ko-KR');
                return `
                    <div style="border:1px solid #eef2f7; background:#fff; border-radius:10px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:6px;">
                            <div style="font-size:13px; font-weight:700; color:#111;">
                                ${escapeHTML(memberName)} · ${escapeHTML(title)}
                            </div>
                            <div style="font-size:11px; color:#6b7280;">${date}</div>
                        </div>
                        <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">${meta}</div>
                        <div style="font-size:13px; color:#374151;">${escapeHTML(f.text)}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 익명 평가 섹션 - 접힘 상태 미리보기 (최근 2개)
function renderFeedbackPreview() {
    const preview = document.getElementById('sectionPreview-feedback');
    if (!preview) return;
    
    const all = FeedbackService.listAll();
    const top2 = all.slice(0, 2);
    
    if (top2.length === 0) {
        preview.innerHTML = `<div style="color:#9ca3af;">익명 평가가 아직 없습니다.</div>`;
        return;
    }
    
    preview.innerHTML = top2.map(f => {
        const member = MemberService.getById(f.memberId);
        const memberName = member ? member.alias : '(알 수 없음)';
        const log = LogService.getAll().find(l => l.id === f.targetId);
        const title = log ? log.title : '(삭제된 활동)';
        const date = log ? log.date : '';
        return `
            <div class="preview-item">
                <div class="preview-title">${escapeHTML(memberName)} · ${escapeHTML(title)}</div>
                <div class="preview-meta">${date}</div>
            </div>
        `;
    }).join('');
}

// 익명 평가 섹션 - 리스트 영역 토글
function toggleFeedbackListArea() {
    const wrapper = document.getElementById('feedbackListWrapper');
    const btn = document.getElementById('fbListToggleBtn');
    if (!wrapper || !btn) return;
    
    const isHidden = wrapper.style.display === 'none';
    
    if (isHidden) {
        wrapper.style.display = 'block';
        btn.textContent = '목록 숨기기';
    } else {
        wrapper.style.display = 'none';
        btn.textContent = '목록 보기';
    }
}

// 타임라인 렌더링
function renderTimeline() {
    const timeline = document.getElementById('timeline');
    const logs = LogService.getAll();
    
    if (logs.length === 0) {
        timeline.innerHTML = '<p style="color: #999; font-size: 14px;">활동 로그가 없습니다.</p>';
        return;
    }
    
    // 날짜순 정렬 (최신순)
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    timeline.innerHTML = sortedLogs.map(log => {
        // 대표 활동 유형
        const primaryType = log.types && log.types.length > 0 ? log.types[0] : '활동';
        
        // 시간 정보
        const timeInfo = log.startTime && log.endTime 
            ? `${log.startTime}~${log.endTime} (${Math.floor(log.duration / 60)}h ${log.duration % 60}m)`
            : '';
        
        // 상태 클래스
        const statusClass = log.status === '완료' ? 'status-complete' : 
                           log.status === '부분완료' ? 'status-partial' : 'status-pending';
        
        return `
            <div class="timeline-row">
                <div class="timeline-summary">
                    <div class="timeline-summary-main">
                        <div class="timeline-summary-title">${log.title}</div>
                        <div class="timeline-summary-meta">
                            <span class="meta-item">${log.date}</span>
                            <span class="meta-item">${primaryType}</span>
                            ${timeInfo ? `<span class="meta-item">${timeInfo}</span>` : ''}
                        </div>
                    </div>
                    <div class="timeline-summary-status">
                        <span class="status-badge ${statusClass}">${log.status}</span>
                    </div>
                </div>
                
                <button class="timeline-detail-toggle" id="toggle-${log.id}" onclick="toggleDetail('${log.id}')">
                    상세보기 ▾
                </button>
                
                <div class="timeline-detail-content" id="detail-${log.id}">
                    ${log.taskScope ? `
                    <div class="detail-section">
                        <div class="detail-label">작업 항목</div>
                        <div class="detail-value">${log.taskScope}</div>
                    </div>
                    ` : ''}
                    
                    ${log.whatIDid ? `
                    <div class="detail-section">
                        <div class="detail-label">실제 수행 내용</div>
                        <div class="detail-value">${log.whatIDid}</div>
                    </div>
                    ` : ''}
                    
                    ${log.why ? `
                    <div class="detail-section">
                        <div class="detail-label">목적/배경</div>
                        <div class="detail-value">${log.why}</div>
                    </div>
                    ` : ''}
                    
                    ${log.how ? `
                    <div class="detail-section">
                        <div class="detail-label">방법/도구</div>
                        <div class="detail-value">${log.how}</div>
                    </div>
                    ` : ''}
                    
                    ${log.beforeAfter ? `
                    <div class="detail-section">
                        <div class="detail-label">변경점</div>
                        <div class="detail-value">${log.beforeAfter}</div>
                    </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <div class="detail-label">참여자</div>
                        <div class="detail-value">
                            ${log.participants.map(p => {
                                const member = MemberService.getById(p.memberId);
                                const memberName = member ? member.alias : '알 수 없음';
                                return `
                                    <div class="participant-row">
                                        <span class="participant-name">${memberName}</span>
                                        <span class="participant-role">${p.role}</span>
                                        <span class="participant-score">기여도 ${p.contributionScore}/5</span>
                                        ${p.comment ? `<div class="participant-comment">${p.comment}</div>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    ${renderFeedbackSection(log.id)}
                    
                    ${log.resultSummary ? `
                    <div class="detail-section">
                        <div class="detail-label">결과 요약</div>
                        <div class="detail-value">${log.resultSummary}</div>
                    </div>
                    ` : ''}
                    
                    ${log.evidenceLink ? `
                    <div class="detail-section">
                        <div class="detail-label">증빙 자료</div>
                        <div class="detail-value">
                            <a href="${log.evidenceLink}" target="_blank" class="evidence-button">🔗 증빙 자료 열기</a>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // 타임라인 미리보기도 업데이트
    renderTimelinePreview();
    
    // 익명 평가 로그 선택 옵션도 업데이트
    renderFeedbackLogOptions();
}

// 상세 보기 토글
function toggleDetail(logId) {
    const detail = document.getElementById(`detail-${logId}`);
    const toggleBtn = document.getElementById(`toggle-${logId}`);
    
    if (detail.classList.contains('show')) {
        detail.classList.remove('show');
        toggleBtn.textContent = '상세보기 ▾';
    } else {
        detail.classList.add('show');
        toggleBtn.textContent = '접기 ▴';
    }
}

// 화면 전환
function goToSummary() {
    const logs = LogService.getAll();
    if (logs.length === 0) {
        alert('로그를 먼저 추가해주세요.');
        return;
    }
    
    document.getElementById('screenA').classList.remove('active');
    document.getElementById('screenB').classList.add('active');
    
    // 요약 화면 진입 시 렌더링 및 PDF 버튼 상태 업데이트
    renderSummary();
    updatePDFButtonState();
}

function goToDashboard() {
    document.getElementById('screenB').classList.remove('active');
    document.getElementById('screenA').classList.add('active');
    
    // 대시보드 복귀 시 타임라인 갱신
    renderTimeline();
}

// ===== 역할 추천 기능 =====

// 역할 추천 토글
function toggleRoleRecommendations() {
    const members = MemberService.getAll();
    const resultDiv = document.getElementById('roleRecommendationResult');
    const toggleBtn = document.getElementById('toggleRoleBtn');
    
    // 현재 표시 상태 확인
    const isVisible = resultDiv.style.display === 'block';
    
    if (isVisible) {
        // 열림 -> 닫힘: 결과 영역 숨기기
        resultDiv.style.display = 'none';
        toggleBtn.innerHTML = ' 역할 추천 보기';
        toggleBtn.style.background = '#17a2b8';
    } else {
        // 닫힘 -> 열림: 추천 실행 및 표시
        if (members.length === 0) {
            alert('팀원을 먼저 추가해주세요.');
            return;
        }
        
        // 추천 엔진 호출 (프로필 없는 팀원도 처리 가능)
        const result = RoleRecommendationEngine.recommendRoles(members);
        
        // 결과 렌더링
        renderRoleRecommendations(result);
        
        // 결과 영역 표시
        resultDiv.style.display = 'block';
        toggleBtn.innerHTML = '✖ 역할 추천 닫기';
        toggleBtn.style.background = '#6c757d';
        
        // 스크롤
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 역할 추천 보기 (하위 호환용 - 기존 함수 유지)
function showRoleRecommendations() {
    const members = MemberService.getAll();
    
    if (members.length === 0) {
        alert('팀원을 먼저 추가해주세요.');
        return;
    }
    
    // 추천 엔진 호출 (프로필 없는 팀원도 처리 가능)
    const result = RoleRecommendationEngine.recommendRoles(members);
    
    // 결과 렌더링
    renderRoleRecommendations(result);
    
    // 결과 영역 표시
    const resultDiv = document.getElementById('roleRecommendationResult');
    resultDiv.style.display = 'block';
    
    // 스크롤
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 추천 텍스트 정리 헬퍼
function sanitizeRecommendationText(text) {
    if (!text) return '';
    
    // 제거할 문구 패턴
    const removePatterns = [
        /프로필\s*정보가?\s*없는?\s*팀원이?\s*있습니다\.?/gi,
        /프로필\s*정보\s*없음\.?/gi,
        /프로필\s*없음\.?/gi,
        /프로필이?\s*부족/gi
    ];
    
    let cleaned = text;
    removePatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });
    
    // 연속된 공백, 쉼표, 점 정리
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^[,.\s]+|[,.\s]+$/g, '');
    
    return cleaned;
}

// 역할 추천 결과 렌더링
function renderRoleRecommendations(result) {
    const contentDiv = document.getElementById('roleRecommendationContent');
    
    if (!result.recommendations || result.recommendations.length === 0) {
        const cleanedMessage = sanitizeRecommendationText(result.message);
        contentDiv.innerHTML = cleanedMessage 
            ? `<p style="color: #666;">${cleanedMessage}</p>`
            : `<p style="color: #666;">추천 결과가 없습니다.</p>`;
        return;
    }
    
    const members = MemberService.getAll();
    
    // 역할 확정 상태 확인 (공통 헬퍼 사용) - 로직은 유지하되 UI에는 표시 안 함
    const allDecided = members.every(isRoleDecided);
    
    // 추천 결과를 카드 형태로 표시
    const cardsHTML = result.recommendations.map(rec => {
        const member = members.find(m => m.id === rec.memberId);
        const roleName = RoleRecommendationEngine.getRoleName(rec.suggestedRole);
        
        // 현재 확정된 역할
        const currentDecidedRole = member ? member.decidedRole : null;
        
        // 역할 선택 드롭다운
        const roleOptions = ['PL', 'DEV', 'DESIGN', 'PRESENT', 'DOCS', 'DATA'];
        const roleNames = {
            'PL': '기획/총괄',
            'DEV': '개발',
            'DESIGN': '디자인',
            'PRESENT': '발표',
            'DOCS': '문서',
            'DATA': '데이터/분석'
        };
        
        const selectHTML = `
            <select 
                id="decidedRole-${rec.memberId}" 
                onchange="updateDecidedRole('${rec.memberId}')"
                style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; width: 100%;">
                <option value="">최종 역할 선택</option>
                ${roleOptions.map(roleKey => 
                    `<option value="${roleKey}" ${currentDecidedRole === roleKey ? 'selected' : ''}>
                        ${roleNames[roleKey]}
                    </option>`
                ).join('')}
            </select>
        `;
        
        // rec.reason 정리
        const cleanedReason = sanitizeRecommendationText(rec.reason);
        
        return `
        <div style="border: 1px solid #ddd; border-radius: 4px; padding: 12px; margin-bottom: 10px; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <strong style="font-size: 14px;">${rec.alias}</strong>
                    <span style="margin-left: 10px; color: #666; font-size: 12px;">→</span>
                    <span style="margin-left: 10px; color: #0066cc; font-weight: bold;">추천: ${roleName}</span>
                </div>
            </div>
            ${cleanedReason ? `<div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                ${cleanedReason}
            </div>` : ''}
            <div style="border-top: 1px dashed #ddd; padding-top: 10px; margin-top: 10px;">
                <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 5px; color: #333;">
                    최종 역할 확정 ${currentDecidedRole ? '✓' : '(필수)'}
                </label>
                ${selectHTML}
                ${currentDecidedRole ? 
                    `<div style="margin-top: 5px; font-size: 11px; color: #28a745;">
                        ✓ 확정됨: ${roleNames[currentDecidedRole]}
                    </div>` : 
                    `<div style="margin-top: 5px; font-size: 11px; color: #dc3545;">
                        ※ 역할을 선택해주세요
                    </div>`
                }
            </div>
        </div>
        `;
    }).join('');
    
    // 안내 박스 제거 - 카드만 표시
    contentDiv.innerHTML = cardsHTML;
}

// 최종 역할 업데이트
function updateDecidedRole(memberId) {
    const selectElement = document.getElementById(`decidedRole-${memberId}`);
    const selectedRole = selectElement.value;
    
    if (!selectedRole) {
        return;
    }
    
    // 팀원의 decidedRole 업데이트
    const member = MemberService.getById(memberId);
    if (member) {
        MemberService.update(memberId, { decidedRole: selectedRole });
        autoSave();
        
        // 팀원 목록 갱신
        renderMembers();
        
        // 추천 결과 다시 렌더링 (확정 상태 업데이트)
        const members = MemberService.getAll();
        const result = RoleRecommendationEngine.recommendRoles(members);
        renderRoleRecommendations(result);
        
        // 모든 역할이 확정되었는지 확인 (공통 헬퍼 사용)
        const allDecided = members.every(isRoleDecided);
        if (allDecided) {
            console.log(' 모든 팀원의 역할이 확정되었습니다!');
        }
    }
}

// ===== Screen B: 요약 & PDF =====

// 대시보드 생성
async function generateSummary() {
    const btn = document.getElementById('generateSummary');
    const members = MemberService.getAll();
    
    // 역할 확정 여부 확인 (공통 헬퍼 사용)
    const allDecided = members.every(isRoleDecided);
    
    if (!allDecided) {
        alert('모든 팀원의 역할이 확정되어야 대시보드를 생성할 수 있습니다.\n\n역할 추천 화면에서 최종 역할을 선택해주세요.');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '대시보드 생성 중...';
    
    try {
        const project = ProjectService.get();
        const logs = LogService.getAll();
        
        // 대시보드 집계 엔진 호출
        const dashboardData = SummaryEngine.generateSummary(project, members, logs);
        
        SummaryService.create(dashboardData);
        renderSummary();
        updatePDFButtonState(); // PDF 버튼 상태 업데이트
        autoSave();
        
    } catch (error) {
        console.error('대시보드 생성 실패:', error);
        alert('대시보드 생성 중 오류가 발생했습니다.');
    } finally {
        btn.disabled = false;
        btn.textContent = '대시보드 재생성';
    }
}

// 요약 렌더링 (대시보드 시각화)
function renderSummary() {
    const dashboardContainer = document.getElementById('dashboardContainer');
    const summaryStatus = document.getElementById('summaryStatus');
    const pdfBtn = document.getElementById('pdfBtn');
    const members = MemberService.getAll();
    
    const summary = SummaryService.getLatest();
    
    // PDF 버튼 상태 업데이트
    updatePDFButtonState();
    
    if (!summary) {
        dashboardContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">대시보드를 생성하려면 "대시보드 생성" 버튼을 클릭하세요.</p>';
        return;
    }
    
    const data = summary.content;
    
    // 대시보드 HTML 생성
    dashboardContainer.innerHTML = `
        ${renderDashboardHeader(summary, data)}
        ${renderKPICards(data.totals)}
        ${renderContributionCharts(data.contribution)}
        ${renderApprovalTable(data.approvals)}
    `;
}

// PDF 버튼 상태 업데이트
function updatePDFButtonState() {
    const summaryStatus = document.getElementById('summaryStatus');
    const pdfBtn = document.getElementById('pdfBtn');
    const members = MemberService.getAll();
    const summary = SummaryService.getLatest();
    
    // 역할 확정 여부 확인
    const allDecided = members.every(isRoleDecided);
    
    if (!allDecided) {
        summaryStatus.innerHTML = '⚠️ PDF 생성 불가: 모든 팀원의 역할을 먼저 확정해주세요.';
        summaryStatus.style.background = '#fff3cd';
        summaryStatus.style.color = '#856404';
        summaryStatus.style.display = 'block';
        pdfBtn.disabled = true;
        pdfBtn.textContent = ' PDF 생성 (역할 확정 필요)';
        return;
    }
    
    if (!summary) {
        summaryStatus.innerHTML = '⚠️ PDF 생성 불가: 대시보드를 먼저 생성해주세요.';
        summaryStatus.style.background = '#fff3cd';
        summaryStatus.style.color = '#856404';
        summaryStatus.style.display = 'block';
        pdfBtn.disabled = true;
        pdfBtn.textContent = ' PDF 생성 (대시보드 생성 필요)';
        return;
    }
    
    // 모든 조건 충족 - 성공 메시지 숨김
    summaryStatus.style.display = 'none';
    pdfBtn.disabled = false;
    pdfBtn.textContent = ' PDF 생성';
}

// 대시보드 헤더
function renderDashboardHeader(summary, data) {
    const generatedDate = new Date(data.generatedAt).toLocaleString('ko-KR');
    
    return `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0;"> 기여도 요약</h2>
            <div style="font-size: 14px; color: #666;">
                <span>생성일시: ${generatedDate}</span>
                <span style="margin-left: 20px;">기간: ${data.period.start} ~ ${data.period.end}</span>
                <span style="margin-left: 20px;">버전: v${summary.version}</span>
            </div>
        </div>
    `;
}

// KPI 카드
function renderKPICards(totals) {
    const hours = Math.floor(totals.totalMinutes / 60);
    const minutes = totals.totalMinutes % 60;
    
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div class="kpi-card">
                <div class="kpi-value">${totals.totalLogs}</div>
                <div class="kpi-label">총 활동 로그</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${hours}h ${minutes}m</div>
                <div class="kpi-label">총 활동 시간</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${totals.logsWithEvidence}</div>
                <div class="kpi-label">증빙 포함 로그</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${totals.collaborativeLogs}</div>
                <div class="kpi-label">공동활동 로그</div>
            </div>
        </div>
    `;
}

// 기여도 차트
function renderContributionCharts(contribution) {
    return `
        <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 15px;"></h3>
            
            <!-- 주차별 히트맵 -->
            <div style="background: white; padding: 24px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0;">주차별 활동 히트맵</h4>
                ${renderHeatmap(contribution.heatmap, { cellSize: 60, labelWidth: 80, gap: 4 })}
            </div>
            
            <!-- 팀원별 활동 유형 비중 -->
            <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0;">팀원별 활동 유형 비중</h4>
                ${renderMemberPieCharts(contribution.byMemberTypeBreakdown)}
            </div>
            
            <!-- 팀원별 상세 -->
            <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h4 style="margin: 0 0 15px 0;">팀원별 기여도 상세</h4>
                ${renderMemberTable(contribution.byMember)}
            </div>
        </div>
    `;
}

// 팀원별 활동 유형 비중 (도넛 차트)
function renderMemberPieCharts(byMemberTypeBreakdown) {
    if (!byMemberTypeBreakdown || byMemberTypeBreakdown.length === 0) {
        return '<p style="color: #999;">데이터 없음</p>';
    }
    
    // 활동 유형별 고정 색상 팔레트 (명확히 구분되는 색상)
    const typeColors = {
        '구현(코딩)': '#2563EB',
        '디자인': '#7C3AED',
        '조사': '#16A34A',
        '회의·조율': '#F59E0B',
        '문서·보고서': '#0D9488',
        '실험·테스트': '#DB2777',
        '기타': '#6B7280'
    };
    
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
            ${byMemberTypeBreakdown.map(member => {
                const total = member.totalScore;
                
                // 도넛 차트용 conic-gradient 생성
                let currentPercent = 0;
                const gradientStops = member.breakdown.map(item => {
                    const percent = (item.score / total) * 100;
                    const color = typeColors[item.type] || '#6B7280';
                    const start = currentPercent;
                    currentPercent += percent;
                    return `${color} ${start}% ${currentPercent}%`;
                }).join(', ');
                
                return `
                    <div class="member-pie-card">
                        <div style="text-align: center; margin-bottom: 12px;">
                            <strong style="font-size: 15px;">${member.alias}</strong>
                        </div>
                        
                        <!-- 도넛 차트 -->
                        <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                            <div class="donut-chart" style="background: conic-gradient(${gradientStops});"></div>
                        </div>
                        
                        <!-- 범례 -->
                        <div style="font-size: 13px;">
                            ${member.breakdown.map(item => {
                                const percent = ((item.score / total) * 100).toFixed(1);
                                const color = typeColors[item.type] || '#6B7280';
                                return `
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                        <div style="display: flex; align-items: center; gap: 6px;">
                                            <div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px;"></div>
                                            <span>${item.type}</span>
                                        </div>
                                        <span class="pie-percent">${percent}%</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 주차별 히트맵
function renderHeatmap(heatmap, options = {}) {
    if (heatmap.weeks.length === 0) {
        return '<p style="color: #999;">데이터 없음</p>';
    }
    
    // 옵션 기본값 (웹용)
    const cellSize = options.cellSize || 40;
    const labelWidth = options.labelWidth || 60;
    const gap = options.gap || 2;
    const fontSize = options.fontSize || 11;
    const cellFontSize = options.cellFontSize || 10;
    
    const maxScore = Math.max(...heatmap.matrix.flat(), 1);
    
    return `
        <div style="overflow-x: auto;">
            <div style="display: inline-block; min-width: 100%;">
                <!-- 요일 헤더 -->
                <div style="display: grid; grid-template-columns: ${labelWidth}px repeat(7, ${cellSize}px); gap: ${gap}px; margin-bottom: 5px;">
                    <div></div>
                    ${heatmap.days.map(day => `
                        <div style="text-align: center; font-size: ${fontSize}px; color: #666;">${day}</div>
                    `).join('')}
                </div>
                
                <!-- 히트맵 그리드 -->
                ${heatmap.weeks.map((week, weekIndex) => `
                    <div style="display: grid; grid-template-columns: ${labelWidth}px repeat(7, ${cellSize}px); gap: ${gap}px; margin-bottom: ${gap}px;">
                        <div style="font-size: ${fontSize}px; color: #666; padding-right: 5px; text-align: right;">${week}</div>
                        ${heatmap.matrix[weekIndex].map(score => {
                            const intensity = score > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
                            const bgColor = score > 0 
                                ? `rgba(74, 144, 226, ${0.2 + (intensity / 100) * 0.8})`
                                : '#f8f9fa';
                            return `
                                <div style="background: ${bgColor}; height: ${cellSize}px; border-radius: 4px; border: 1px solid #dee2e6; display: flex; align-items: center; justify-content: center; font-size: ${cellFontSize}px; color: ${score > 0 ? '#000' : '#ccc'};" title="${score}점">
                                    ${score > 0 ? score : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// 팀원별 테이블
function renderMemberTable(byMember) {
    if (byMember.length === 0) {
        return '<p style="color: #999;">데이터 없음</p>';
    }
    
    const roleNames = {
        'PL': '기획/총괄',
        'DEV': '개발',
        'DESIGN': '디자인',
        'PRESENT': '발표',
        'DOCS': '문서',
        'DATA': '데이터/분석',
        '미확정': '미확정'
    };
    
    return `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">팀원</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">역할</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">기여도 점수</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">활동 시간</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">로그 수</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">공동활동</th>
                </tr>
            </thead>
            <tbody>
                ${byMember.map(m => {
                    const hours = Math.floor(m.minutesSum / 60);
                    const minutes = m.minutesSum % 60;
                    const roleName = roleNames[m.decidedRole] || m.decidedRole;
                    
                    return `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>${m.alias}</strong></td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">${roleName}</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;"><strong>${m.scoreSum}</strong></td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${hours}h ${minutes}m</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${m.logCount}</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${m.collaborativeCount}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// 승인 상황 테이블
function renderApprovalTable(approvals) {
    if (approvals.pending.length === 0 && approvals.rejected.length === 0) {
        return '';
    }
    
    let html = '<div style="margin-bottom: 30px;"><h3 style="margin-bottom: 15px;">⚠️ 승인 대기 중인 활동</h3>';
    
    if (approvals.pending.length > 0) {
        html += `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107; margin-bottom: 15px;">
                <strong style="color: #856404;">승인 대기: ${approvals.pending.length}건</strong>
                <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">로그</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">팀원</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">역할</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${approvals.pending.map(p => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${p.logTitle}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${p.alias}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${p.role}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    if (approvals.rejected.length > 0) {
        html += `
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border: 1px solid #dc3545;">
                <strong style="color: #721c24;">거부됨: ${approvals.rejected.length}건</strong>
                <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">로그</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">팀원</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">역할</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">사유</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${approvals.rejected.map(r => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${r.logTitle}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${r.alias}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${r.role}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${r.reason || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// 요약 승인 (제거 - 대시보드에서는 불필요)
function approveSummary() {
    const summary = SummaryService.getLatest();
    
    if (!summary) {
        alert('요약이 없습니다.');
        return;
    }
    
    if (summary.status !== 'DRAFT') {
        alert('이미 승인된 요약입니다.');
        return;
    }
    
    // 승인 확인
    const confirmed = confirm(
        '요약을 승인하시겠습니까?\n\n' +
        '승인 후에는 상태를 변경할 수 없으며,\n' +
        'PDF 생성이 가능해집니다.'
    );
    
    if (!confirmed) {
        return;
    }
    
    // 상태 변경
    SummaryService.approve(summary.id);
    
    // UI 업데이트
    renderSummary();
    autoSave();
    
    // 성공 피드백
    showSuccessMessage('요약이 승인되었습니다! 이제 PDF를 생성할 수 있습니다.');
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// PDF 생성
function generatePDF() {
    const summary = SummaryService.getLatest();
    const members = MemberService.getAll();
    
    // 역할 확정 여부 확인
    const allDecided = members.every(isRoleDecided);
    
    if (!allDecided) {
        alert('모든 팀원의 역할이 확정되어야 PDF를 생성할 수 있습니다.');
        return;
    }
    
    if (!summary) {
        alert('대시보드를 먼저 생성해주세요.');
        return;
    }
    
    const project = ProjectService.get();
    const logs = LogService.getAll();
    
    // 대시보드 모드: dashboardSummary 스키마 확인
    const isDashboardMode = summary.content && 
                           summary.content.totals && 
                           summary.content.contribution;
    
    let htmlContent;
    
    if (isDashboardMode) {
        // 대시보드 모드: 새로운 PDF 생성
        htmlContent = generateDashboardPDFHTML(summary, project, members, logs);
    } else {
        // 레거시 모드: 기존 PDF 생성 (하위 호환)
        if (summary.status !== 'APPROVED') {
            alert('승인된 요약이 필요합니다.');
            return;
        }
        htmlContent = generatePDFHTML(summary, project, members, logs);
    }
    
    // 임시 iframe으로 HTML 렌더링 후 PDF 생성
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // 렌더링 완료 후 PDF 생성
    setTimeout(() => {
        iframe.contentWindow.print();
        // 또는 jsPDF html2canvas 사용
        document.body.removeChild(iframe);
    }, 500);
}

// PDF HTML 템플릿 생성
function generatePDFHTML(summary, project, members, logs) {
    // 날짜 포맷
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const formatDateTime = (dateStr) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
    };
    
    // 기간 계산 (logs 기준)
    let periodStart = '', periodEnd = '';
    if (logs.length > 0) {
        const dates = logs.map(log => new Date(log.date)).sort((a, b) => a - b);
        periodStart = formatDate(dates[0]);
        periodEnd = formatDate(dates[dates.length - 1]);
    } else {
        periodStart = periodEnd = formatDate(new Date());
    }
    
    // 역할 이름 매핑
    const roleNames = {
        'PL': '기획/총괄',
        'DEV': '개발',
        'DESIGN': '디자인',
        'PRESENT': '발표',
        'DOCS': '문서',
        'DATA': '데이터/분석'
    };
    
    // 팀원 목록 (members 기준, decidedRole 사용)
    const teamMembersList = members.map(m => {
        const role = m.decidedRole ? (roleNames[m.decidedRole] || m.decidedRole) : '미확정';
        return `${m.alias}(${role})`;
    }).join(', ');
    
    // 역할 분담 테이블 (members 기준, decidedRole 사용)
    const roleTableRows = members.map(m => {
        const role = m.decidedRole ? (roleNames[m.decidedRole] || m.decidedRole) : '미확정';
        return `
        <tr>
            <td class="mono">${m.alias}</td>
            <td>${role}</td>
        </tr>
        `;
    }).join('');
    
    // 팀 하이라이트 (summary.team_highlights, 최대 3개)
    const highlightsHTML = summary.content.team_highlights.slice(0, 3).map(h => 
        `<li>${h}</li>`
    ).join('');
    
    // 팀원별 기여 카드 (summary.member_summaries 기준)
    const memberCardsHTML = summary.content.member_summaries.map(ms => {
        // bullets → 리스트
        const bulletsHTML = ms.bullets.map(b => `<li>${b}</li>`).join('');
        
        // evidence_log_ids → 근거 표기
        const evidenceIds = ms.evidence_log_ids.slice(0, 3).map(id => `<span class="mono">#${id}</span>`).join(', ');
        const evidenceCount = ms.evidence_log_ids.length;
        
        return `
        <div class="card">
            <div class="title"><b>${ms.alias}</b></div>
            <ul class="ul-tight">${bulletsHTML}</ul>
            <div class="evidence small">
                <b>근거:</b> ${evidenceCount}개 활동 (대표 ${evidenceIds})<br/>
                <span class="muted">evidence_log_ids:</span> <span class="mono">[${ms.evidence_log_ids.join(', ')}]</span>
            </div>
        </div>
        `;
    }).join('');
    
    // 타임라인 (logs를 날짜순 정렬 후 대표 5개) - participants 기반
    const recentLogs = [...logs]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const timelineHTML = recentLogs.map(log => {
        // participants 기반으로 참여자 정보 추출
        const participantNames = log.participants && log.participants.length > 0
            ? log.participants.map(p => {
                const member = MemberService.getById(p.memberId);
                return member ? member.alias : 'Unknown';
              }).join(', ')
            : 'Unknown';
        
        // 활동 유형 (types 배열의 첫 번째 항목)
        const activityType = log.types && log.types.length > 0 ? log.types[0] : '활동';
        
        return `
        <li>
            <div class="meta"><span class="mono">[${log.date}]</span> (${activityType}) <span class="mono">${participantNames}</span></div>
            <div>${log.title}</div>
        </li>
        `;
    }).join('');
    
    // 리스크/갭 (summary.gaps)
    const gapsHTML = summary.content.gaps && summary.content.gaps.length > 0
        ? `<h2>6) 리스크/갭</h2>
           <ul class="ul-tight">
               ${summary.content.gaps.map(g => `<li>${g}</li>`).join('')}
           </ul>`
        : '';
    
    // 상태 칩
    const statusChip = summary.status === 'APPROVED' 
        ? '<span class="chip">APPROVED</span>' 
        : '<span class="chip">DRAFT</span>';
    
    // 시스템 고지 문구 (규칙 기반 자동 집계)
    const systemNoticeHTML = summary.content.usedFallback
        ? `<ul class="ul-tight">
            <li>본 요약은 입력된 로그를 바탕으로 자동 집계된 참고 정보이며 최종 판단은 평가자에게 있습니다.</li>
            <li>민감정보(연락처/계좌/주민번호 등)는 입력하지 않습니다.</li>
            <li>시스템은 요약만 수행하며, 평가나 점수화는 하지 않습니다.</li>
            <li><strong>대체 집계 방식(규칙 기반)으로 생성되었습니다.</strong></li>
           </ul>`
        : `<ul class="ul-tight">
            <li>본 요약은 입력된 로그를 바탕으로 자동 집계된 참고 정보이며 최종 판단은 평가자에게 있습니다.</li>
            <li>민감정보(연락처/계좌/주민번호 등)는 입력하지 않습니다.</li>
            <li>시스템은 요약만 수행하며, 평가나 점수화는 하지 않습니다.</li>
           </ul>`;
    
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>팀 기여도 로그 - 평가자 확인용 리포트</title>
<style>
@page { size: A4; margin: 16mm 14mm; }
html, body { font-family: Arial, "Noto Sans KR", sans-serif; color: #111; }
body { margin: 0; }
.page { page-break-after: always; padding: 0; }
.page:last-child { page-break-after: auto; }
h1 { font-size: 18px; margin: 0 0 6px 0; }
h2 { font-size: 13px; margin: 18px 0 8px 0; padding-top: 2px; border-top: 1px solid #ddd; }
h3 { font-size: 12px; margin: 12px 0 6px 0; }
p, li, td, th { font-size: 10.5px; line-height: 1.45; }
.muted { color: #555; }
.small { font-size: 9.5px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ddd; padding: 12px 0 10px 0; margin-bottom: 10px; }
.header-right { text-align: right; }
.kv { margin: 0; }
.kv b { display: inline-block; min-width: 70px; }
.chip { display:inline-block; padding: 2px 6px; border: 1px solid #999; border-radius: 10px; font-size: 9px; margin-left: 6px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ddd; padding: 6px 7px; vertical-align: top; }
th { background: #f6f6f6; font-weight: 700; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.card { border: 1px solid #ddd; border-radius: 6px; padding: 8px 9px; }
.card .title { display:flex; justify-content:space-between; align-items:baseline; margin-bottom: 4px; }
.card .title b { font-size: 11px; }
.evidence { margin-top: 6px; border-top: 1px dashed #ddd; padding-top: 6px; }
.ol-tight { margin: 0 0 0 16px; padding: 0; }
.ul-tight { margin: 0 0 0 16px; padding: 0; }
.timeline { list-style: none; padding: 0; margin: 0; }
.timeline li { padding: 6px 0; border-bottom: 1px dashed #eee; }
.timeline .meta { font-weight: 700; }
.footer-note { margin-top: 14px; border-top: 1px solid #ddd; padding-top: 8px; }
</style>
</head>
<body>

<!-- ===================== Page 1 ===================== -->
<section class="page">
<div class="header">
    <div>
        <h1>팀 기여도 로그 – 평가자 확인용 리포트</h1>
        <div class="small muted">본 문서는 팀 프로젝트 활동 기반 요약 및 결과물 확인을 위한 리포트입니다.</div>
    </div>
    <div class="header-right small">
        <div>생성일시: <span class="mono">${formatDateTime(summary.generatedAt)}</span></div>
        <div>요약버전: <span class="mono">v${summary.version}</span> ${statusChip}</div>
    </div>
</div>

<h2>1) 프로젝트 정보</h2>
<p class="kv"><b>프로젝트명</b> ${project.name}</p>
<p class="kv"><b>기간</b> <span class="mono">${periodStart}</span> ~ <span class="mono">${periodEnd}</span></p>
<p class="kv"><b>팀원</b> ${teamMembersList}</p>
<p class="kv"><b>총 활동</b> ${logs.length}개</p>

<h2>2) 역할 분담</h2>
<table>
    <thead>
        <tr>
            <th style="width:20%;">팀원</th>
            <th>역할</th>
        </tr>
    </thead>
    <tbody>
        ${roleTableRows}
    </tbody>
</table>

<h2>3) 팀 하이라이트(최대 3줄)</h2>
<ol class="ol-tight">
    ${highlightsHTML}
</ol>

<h2>4) 팀원별 기여 요약(근거 포함)</h2>
<div class="two-col">
    ${memberCardsHTML}
</div>

<div class="footer-note small muted">
※ 요약은 입력된 활동 내용을 기반으로 생성됩니다. 활동 내용이 부족하거나 편향되면 요약도 제한될 수 있습니다.
</div>
</section>

<!-- ===================== Page 2 ===================== -->
<section class="page">
<div class="header">
    <div>
        <h1>팀 기여도 로그 – 타임라인 및 고지</h1>
    </div>
    <div class="header-right small">
        <div>프로젝트: <span class="mono">${project.name}</span></div>
        <div>기간: <span class="mono">${periodStart} ~ ${periodEnd}</span></div>
    </div>
</div>

<h2>5) 타임라인 요약(대표 활동 5개)</h2>
<ul class="timeline">
    ${timelineHTML}
</ul>

${gapsHTML}

<h2>7) 시스템 고지 및 준수</h2>
${systemNoticeHTML}

<div class="footer-note small muted">
파일명: <span class="mono">${project.name}_v${summary.version}_${formatDate(summary.generatedAt)}_${summary.status}.pdf</span>
</div>
</section>

</body>
</html>`;
}

// 대시보드 PDF HTML 템플릿 생성
function generateDashboardPDFHTML(summary, project, members, logs) {
    const data = summary.content;
    
    // 날짜 포맷
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const formatDateTime = (dateStr) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
    };
    
    // 역할 이름 매핑
    const roleNames = {
        'PL': '기획/총괄',
        'DEV': '개발',
        'DESIGN': '디자인',
        'PRESENT': '발표',
        'DOCS': '문서',
        'DATA': '데이터/분석'
    };
    
    // 팀원 목록
    const teamMembersList = members.map(m => {
        const role = m.decidedRole ? (roleNames[m.decidedRole] || m.decidedRole) : '미확정';
        return `${m.alias}(${role})`;
    }).join(', ');
    
    // 역할 분담 테이블
    const roleTableRows = members.map(m => {
        const role = m.decidedRole ? (roleNames[m.decidedRole] || m.decidedRole) : '미확정';
        return `
        <tr>
            <td class="mono">${m.alias}</td>
            <td>${role}</td>
        </tr>
        `;
    }).join('');
    
    // 팀원별 기여도 테이블
    const memberContributionRows = data.contribution.byMember.map(m => {
        const hours = Math.floor(m.minutesSum / 60);
        const minutes = m.minutesSum % 60;
        const roleName = roleNames[m.decidedRole] || m.decidedRole;
        
        return `
        <tr>
            <td class="mono">${m.alias}</td>
            <td>${roleName}</td>
            <td style="text-align: center;"><strong>${m.scoreSum}</strong></td>
            <td style="text-align: center;">${hours}h ${minutes}m</td>
            <td style="text-align: center;">${m.logCount}</td>
            <td style="text-align: center;">${m.collaborativeCount}</td>
        </tr>
        `;
    }).join('');
    
    // 역할별 기여도 테이블
    const roleContributionRows = data.contribution.byRole.map(r => {
        const roleName = roleNames[r.role] || r.role;
        return `
        <tr>
            <td>${roleName}</td>
            <td style="text-align: center;"><strong>${r.scoreSum}</strong></td>
            <td style="text-align: center;">${r.participantCount}</td>
        </tr>
        `;
    }).join('');
    
    // 타임라인 (전체)
    const allLogsSorted = [...logs]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const timelineHTML = allLogsSorted.map(log => {
        const participantNames = log.participants && log.participants.length > 0
            ? log.participants.map(p => {
                const member = MemberService.getById(p.memberId);
                return member ? member.alias : 'Unknown';
              }).join(', ')
            : 'Unknown';
        
        const activityType = log.types && log.types.length > 0 ? log.types[0] : '활동';
        
        return `
        <li>
            <div class="meta"><span class="mono">[${log.date}]</span> (${activityType}) <span class="mono">${participantNames}</span></div>
            <div>${log.title}</div>
        </li>
        `;
    }).join('');
    
    // KPI 값
    const totalHours = Math.floor(data.totals.totalMinutes / 60);
    const totalMinutes = data.totals.totalMinutes % 60;
    
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>팀 기여도 대시보드 리포트</title>
<style>
@page { size: A4; margin: 16mm 14mm; }
/* 인쇄/PDF에서 배경색·그라디언트 강제 출력 */
html, body, * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
}
html, body { font-family: Arial, "Noto Sans KR", sans-serif; color: #111; }
body { margin: 0; }
.page { page-break-after: always; padding: 0; }
.page:last-child { page-break-after: auto; }
h1 { font-size: 18px; margin: 0 0 6px 0; }
h2 { font-size: 13px; margin: 18px 0 8px 0; padding-top: 2px; border-top: 1px solid #ddd; }
h3 { font-size: 12px; margin: 12px 0 6px 0; }
p, li, td, th { font-size: 10.5px; line-height: 1.45; }
.muted { color: #555; }
.small { font-size: 9.5px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ddd; padding: 12px 0 10px 0; margin-bottom: 10px; }
.header-right { text-align: right; }
.kv { margin: 0; }
.kv b { display: inline-block; min-width: 70px; }
.chip { display:inline-block; padding: 2px 6px; border: 1px solid #999; border-radius: 10px; font-size: 9px; margin-left: 6px; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th, td { border: 1px solid #ddd; padding: 6px 7px; vertical-align: top; }
th { background: #f6f6f6 !important; font-weight: 700; }
.two-col-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; }
.role-col, .kpi-col, .heatmap-section, .donut-section { break-inside: avoid; page-break-inside: avoid; }
.role-col table { margin-top: 0; }
.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 0; }
.kpi-card { border: 1px solid #ddd; border-radius: 6px; padding: 8px; text-align: center; background: #f9f9f9 !important; }
.kpi-value { font-size: 16px; font-weight: bold; color: #007bff; }
.kpi-label { font-size: 8.5px; color: #666; margin-top: 3px; }
.heatmap-section { break-inside: avoid; page-break-inside: avoid; }
.heatmap-wrap { padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px; }
.heatmap-grid { display: inline-block; min-width: 100%; }
.heatmap-row { display: grid; grid-template-columns: 50px repeat(7, 28px); gap: 1px; margin-bottom: 1px; }
.heatmap-header { display: grid; grid-template-columns: 50px repeat(7, 28px); gap: 1px; margin-bottom: 5px; }
.heatmap-cell { height: 28px; border-radius: 4px; border: 1px solid #dee2e6; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; }
.heatmap-label { font-size: 9px; color: #666; text-align: right; padding-right: 5px; }
.donut-section { break-inside: avoid; page-break-inside: avoid; }
.activity-graph-wrap { break-inside: avoid; page-break-inside: avoid; padding: 10px; }
.donut-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px; }
.member-pie-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px; background: #fff !important; break-inside: avoid; page-break-inside: avoid; text-align: center; }
.donut-chart { width: 72px; height: 72px; border-radius: 50%; position: relative; margin: 8px auto; }
.donut-chart::after { content: ""; position: absolute; inset: 16px; background: #fff !important; border-radius: 50%; z-index: 1; }
.donut-legend { font-size: 8.5px; text-align: left; margin-top: 6px; }
.donut-legend-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
.donut-color { width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: 4px; }
.pie-percent { font-weight: 800; font-size: 11px; }
.member-pie-card span { font-size: 11px; }
h2 { margin: 8px 0 6px 0; }
h3, h4 { margin: 8px 0 6px 0; }
.summary-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.summary-table th, .summary-table td { border: 1px solid #ddd; padding: 8px 9px; font-size: 10.5px; vertical-align: top; }
.summary-table th { background: #f6f6f6 !important; font-weight: 700; }
.summary-table td strong { font-weight: 700; }
.summary-table tr { break-inside: avoid; page-break-inside: avoid; }
.summary-note { margin-top: 10px; font-size: 9.5px; color: #555; line-height: 1.5; }
.timeline { list-style: none; padding: 0; margin: 0; }
.timeline li { padding: 6px 0; border-bottom: 1px dashed #eee; break-inside: avoid; page-break-inside: avoid; }
.timeline .meta { font-weight: 700; }
.footer-note { margin-top: 14px; border-top: 1px solid #ddd; padding-top: 8px; }

/* PDF 전용 크기 축소 */
@media print {
    /* 히트맵/활동그래프 섹션 간 여백 축소 */
    h3, h4 { margin: 8px 0 6px 0 !important; }
    .heatmap-wrap { padding: 10px !important; margin-bottom: 8px !important; }
    .activity-graph-wrap { padding: 10px !important; }
    
    /* 도넛 차트 크기 축소 */
    .donut-chart { width: 72px !important; height: 72px !important; }
    .donut-chart::after { inset: 16px !important; }
    
    /* 카드 패딩/텍스트 축소 */
    .member-pie-card { padding: 8px !important; }
    .member-pie-card span { font-size: 11px !important; }
    .pie-percent { font-size: 11px !important; font-weight: 800 !important; }
}
</style>
</head>
<body>

<!-- ===================== Page 1 ===================== -->
<section class="page">
<div class="header">
    <div>
        <h1>팀 기여도 대시보드 리포트</h1>
        <div class="small muted">본 문서는 팀 프로젝트 활동 로그 기반 기여도 분석 리포트입니다.</div>
    </div>
    <div class="header-right small">
        <div>생성일시: <span class="mono">${formatDateTime(data.generatedAt)}</span></div>
        <div>버전: <span class="mono">v${summary.version}</span></div>
    </div>
</div>

<h2>1) 프로젝트 정보</h2>
<p class="kv"><b>프로젝트명</b> ${project.name}</p>
<p class="kv"><b>기간</b> <span class="mono">${data.period.start}</span> ~ <span class="mono">${data.period.end}</span></p>
<p class="kv"><b>팀원</b> ${teamMembersList}</p>
<p class="kv"><b>총 활동</b> ${data.totals.totalLogs}개 로그</p>

<h2>2) 역할 분담 및 주요 지표</h2>
<div class="two-col-row">
    <div class="col role-col">
        <table>
            <thead>
                <tr>
                    <th style="width:35%;">팀원</th>
                    <th>역할</th>
                </tr>
            </thead>
            <tbody>
                ${roleTableRows}
            </tbody>
        </table>
    </div>
    
    <div class="col kpi-col">
        <h3 style="margin:0 0 6px 0;"> 주요 지표 </h3>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${data.totals.totalLogs}</div>
                <div class="kpi-label">총 활동 로그</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${totalHours}h ${totalMinutes}m</div>
                <div class="kpi-label">총 활동 시간</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.totals.logsWithEvidence}</div>
                <div class="kpi-label">증빙 포함 로그</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.totals.collaborativeLogs}</div>
                <div class="kpi-label">공동활동 로그</div>
            </div>
        </div>
    </div>
</div>

<div class="heatmap-section">
<h2>3) 주차별 활동 히트맵</h2>
<div class="heatmap-wrap">
${renderHeatmap(data.contribution.heatmap, { cellSize: 28, labelWidth: 50, gap: 1, fontSize: 9, cellFontSize: 9 })}
</div>
</div>

<div class="donut-section">
<h2>4) 활동 그래프</h2>
<div class="activity-graph-wrap">
${(() => {
    const byMemberTypeBreakdown = data.contribution.byMemberTypeBreakdown;
    if (!byMemberTypeBreakdown || byMemberTypeBreakdown.length === 0) {
        return '<p style="color: #999; font-size: 10px;">데이터 없음</p>';
    }
    
    const typeColors = {
        '구현(코딩)': '#2563EB',
        '디자인': '#7C3AED',
        '조사': '#16A34A',
        '회의·조율': '#F59E0B',
        '문서·보고서': '#0D9488',
        '실험·테스트': '#DB2777',
        '기타': '#6B7280'
    };
    
    return `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            ${byMemberTypeBreakdown.map(member => {
                const total = member.totalScore;
                
                let currentPercent = 0;
                const gradientStops = member.breakdown.map(item => {
                    const percent = (item.score / total) * 100;
                    const color = typeColors[item.type] || '#6B7280';
                    const start = currentPercent;
                    currentPercent += percent;
                    return `${color} ${start}% ${currentPercent}%`;
                }).join(', ');
                
                return `
                    <div class="member-pie-card">
                        <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">${member.alias}</div>
                        
                        <div class="donut-chart" style="background: conic-gradient(${gradientStops}) !important;"></div>
                        
                        <div class="donut-legend">
                            ${member.breakdown.map(item => {
                                const percent = ((item.score / total) * 100).toFixed(1);
                                const color = typeColors[item.type] || '#6B7280';
                                return `
                                    <div class="donut-legend-item">
                                        <div style="display: flex; align-items: center; gap: 3px;">
                                            <span class="donut-color" style="background: ${color} !important;"></span>
                                            <span>${item.type}</span>
                                        </div>
                                        <span class="pie-percent">${percent}%</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
})()}
</div>
</div>

<div class="footer-note small muted">
※ 기여도는 입력된 활동 내용 기반으로 집계됩니다. 활동 내용이 부족하거나 편향되면 결과도 제한될 수 있습니다.
</div>
</section>

<!-- ===================== Page 2 ===================== -->
<section class="page">
<div class="header">
    <div>
        <h1></h1>
    </div>
    <div class="header-right small">
        <div>프로젝트: <span class="mono">${project.name}</span></div>
        <div>기간: <span class="mono">${data.period.start} ~ ${data.period.end}</span></div>
    </div>
</div>

<h2>5) 익명 평가 요약</h2>
${(() => {
    const feedbacks = FeedbackService.getAll()
        .filter(f => f.targetType === 'LOG' && !f.isHidden)
        .sort((a, b) => b.createdAt - a.createdAt);
    
    if (feedbacks.length === 0) {
        return '<p style="color: #999; font-size: 10px;">익명 평가가 없습니다.</p>';
    }
    
    // 최근 10개만 표시
    const recentFeedbacks = feedbacks.slice(0, 10);
    
    const feedbackRows = recentFeedbacks.map(f => {
        const member = members.find(m => m.id === f.memberId);
        const memberName = member ? member.alias : '알 수 없음';
        const log = logs.find(l => l.id === f.targetId);
        const logTitle = log ? log.title : '(삭제된 활동)';
        const logDate = log ? log.date : '';
        
        return `
            <tr>
                <td><strong>${memberName}</strong></td>
                <td>${logDate} · ${logTitle}</td>
                <td>${escapeHTML(f.text)}</td>
            </tr>
        `;
    }).join('');
    
    return `
        <p class="kv"><b>총 익명평가</b> ${feedbacks.length}건</p>
        <table style="margin-top: 8px;">
            <thead>
                <tr>
                    <th style="width:18%;">팀원</th>
                    <th style="width:35%;">활동</th>
                    <th>한줄 평가</th>
                </tr>
            </thead>
            <tbody>
                ${feedbackRows}
            </tbody>
        </table>
        <div class="small muted" style="margin-top:6px;">※ 최근 10개만 표시됩니다.</div>
    `;
})()}

<h2>6) 멤버별 기여도 상세</h2>
${(() => {
    // contribution.byMember 데이터 사용 (기존 집계 로직 그대로)
    const memberDetails = data.contribution.byMember;
    
    if (!memberDetails || memberDetails.length === 0) {
        return '<p style="color: #999; font-size: 10px;">데이터 없음</p>';
    }
    
    return `
        <table class="summary-table">
            <thead>
                <tr>
                    <th style="width:15%;">팀원</th>
                    <th style="width:15%;">역할</th>
                    <th style="width:15%;">기여도 점수</th>
                    <th style="width:15%;">활동 시간</th>
                    <th style="width:12%;">활동 수</th>
                    <th style="width:12%;">공동활동</th>
                </tr>
            </thead>
            <tbody>
                ${memberDetails.map(m => {
                    const hours = Math.floor(m.minutesSum / 60);
                    const minutes = m.minutesSum % 60;
                    const roleName = roleNames[m.decidedRole] || m.decidedRole || '미확정';
                    
                    return `
                        <tr>
                            <td><strong>${m.alias}</strong></td>
                            <td>${roleName}</td>
                            <td style="text-align: center;"><strong>${m.scoreSum}</strong></td>
                            <td style="text-align: center;">${hours}h ${minutes}m</td>
                            <td style="text-align: center;">${m.logCount}</td>
                            <td style="text-align: center;">${m.collaborativeCount}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <p class="summary-note">
        ※ 기여도 점수는 활동별 기여도 점수의 합계이며, 활동 수는 참여한 로그 개수입니다.<br/>
        ※ 공동활동은 2명 이상이 참여한 활동의 개수입니다.
        </p>
    `;
})()}

<h2>7) 전체 활동 타임라인</h2>
<ul class="timeline">
    ${timelineHTML}
</ul>

<div class="footer-note small muted">
파일명: <span class="mono">${project.name}_dashboard_v${summary.version}_${formatDate(data.generatedAt)}.pdf</span>
</div>
</section>

</body>
</html>`;
}

// 앱 시작
init();
