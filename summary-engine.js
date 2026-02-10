/**
 * 대시보드 집계 엔진 (규칙 기반)
 * 
 * 입력: project, members, logs
 * 출력: dashboardSummary JSON
 * 
 * 로그 스키마: participants 기반
 * - log.participants: [{ memberId, role, contributionScore, comment, approved }]
 * - log.startTime, log.endTime, log.duration
 * - log.evidenceLink
 * - log.date
 * 
 * 주의: 이 엔진은 외부 AI/LLM을 사용하지 않으며,
 * 모든 계산은 규칙 기반 로직으로 수행됩니다.
 */

const SummaryEngine = {
    /**
     * 대시보드 요약 자동 생성 (규칙 기반 집계)
     * @param {Object} project - 프로젝트 정보
     * @param {Array} members - 팀원 목록 (decidedRole 포함)
     * @param {Array} logs - 활동 로그 목록 (participants 기반)
     * @returns {Object} dashboardSummary - 자동 집계된 대시보드 데이터
     */
    generateSummary(project, members, logs) {
        const generatedAt = new Date().toISOString();
        
        // 기간 계산
        const period = this.calculatePeriod(logs);
        
        // 전체 지표
        const totals = this.calculateTotals(logs);
        
        // 기여도 분석
        const contribution = this.analyzeContribution(members, logs);
        
        // 승인 상황
        const approvals = this.analyzeApprovals(members, logs);
        
        return {
            generatedAt,
            period,
            totals,
            contribution,
            approvals
        };
    },
    
    /**
     * 기간 계산
     */
    calculatePeriod(logs) {
        if (logs.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            return { start: today, end: today };
        }
        
        const dates = logs.map(log => log.date).sort();
        return {
            start: dates[0],
            end: dates[dates.length - 1]
        };
    },
    
    /**
     * 전체 지표 계산
     */
    calculateTotals(logs) {
        const totalLogs = logs.length;
        
        // 총 활동 시간 (분)
        const totalMinutes = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
        
        // 증빙 포함 로그 수
        const logsWithEvidence = logs.filter(log => 
            log.evidenceLink && log.evidenceLink.trim() !== ''
        ).length;
        
        // 공동활동 로그 수 (참여자 2명 이상)
        const collaborativeLogs = logs.filter(log => 
            log.participants && log.participants.length >= 2
        ).length;
        
        return {
            totalLogs,
            totalMinutes,
            logsWithEvidence,
            collaborativeLogs
        };
    },
    
    /**
     * 기여도 분석
     */
    analyzeContribution(members, logs) {
        return {
            byMember: this.contributionByMember(members, logs),
            byRole: this.contributionByRole(logs),
            byDate: this.contributionByDate(logs),
            heatmap: this.generateHeatmap(logs),
            byMemberTypeBreakdown: this.contributionByMemberTypeBreakdown(members, logs)
        };
    },
    
    /**
     * 팀원별 기여도
     */
    contributionByMember(members, logs) {
        return members.map(member => {
            // 해당 팀원이 참여한 로그들
            const memberLogs = logs.filter(log => 
                log.participants && log.participants.some(p => p.memberId === member.id)
            );
            
            // 기여도 점수 합계
            const scoreSum = memberLogs.reduce((sum, log) => {
                const participant = log.participants.find(p => p.memberId === member.id);
                return sum + (participant ? participant.contributionScore : 0);
            }, 0);
            
            // 활동 시간 합계
            const minutesSum = memberLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
            
            // 로그 개수
            const logCount = memberLogs.length;
            
            // 공동활동 참여 횟수
            const collaborativeCount = memberLogs.filter(log => 
                log.participants && log.participants.length >= 2
            ).length;
            
            return {
                memberId: member.id,
                alias: member.alias,
                decidedRole: member.decidedRole || '미확정',
                scoreSum,
                minutesSum,
                logCount,
                collaborativeCount
            };
        });
    },
    
    /**
     * 역할별 기여도
     */
    contributionByRole(logs) {
        const roleMap = {};
        
        logs.forEach(log => {
            if (!log.participants) return;
            
            log.participants.forEach(p => {
                const role = p.role || '미지정';
                
                if (!roleMap[role]) {
                    roleMap[role] = {
                        role,
                        scoreSum: 0,
                        participantCount: 0
                    };
                }
                
                roleMap[role].scoreSum += p.contributionScore || 0;
                roleMap[role].participantCount += 1;
            });
        });
        
        return Object.values(roleMap).sort((a, b) => b.scoreSum - a.scoreSum);
    },
    
    /**
     * 팀원별 활동 유형 비중
     */
    contributionByMemberTypeBreakdown(members, logs) {
        return members.map(member => {
            const typeMap = {};
            
            // 해당 팀원이 참여한 로그들
            logs.forEach(log => {
                if (!log.participants) return;
                
                const participant = log.participants.find(p => p.memberId === member.id);
                if (!participant) return;
                
                const score = participant.contributionScore || 1;
                const types = log.types || [];
                
                // 각 활동 유형에 점수 분배 (여러 유형이면 나눠서)
                const scorePerType = types.length > 0 ? score / types.length : 0;
                
                types.forEach(type => {
                    if (!typeMap[type]) {
                        typeMap[type] = 0;
                    }
                    typeMap[type] += scorePerType;
                });
            });
            
            // 배열로 변환하고 점수 기준 정렬
            const breakdown = Object.entries(typeMap)
                .map(([type, score]) => ({ type, score }))
                .sort((a, b) => b.score - a.score);
            
            // 총점 계산
            const totalScore = breakdown.reduce((sum, item) => sum + item.score, 0);
            
            return {
                memberId: member.id,
                alias: member.alias,
                breakdown,
                totalScore
            };
        }).filter(m => m.totalScore > 0); // 활동이 있는 팀원만
    },
    
    /**
     * 날짜별 기여도
     */
    contributionByDate(logs) {
        const dateMap = {};
        
        logs.forEach(log => {
            const date = log.date;
            
            if (!dateMap[date]) {
                dateMap[date] = {
                    date,
                    scoreSum: 0,
                    minutesSum: 0,
                    logCount: 0
                };
            }
            
            // 해당 날짜의 모든 참여자 점수 합산
            const dayScore = log.participants 
                ? log.participants.reduce((sum, p) => sum + (p.contributionScore || 0), 0)
                : 0;
            
            dateMap[date].scoreSum += dayScore;
            dateMap[date].minutesSum += log.duration || 0;
            dateMap[date].logCount += 1;
        });
        
        return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    },
    
    /**
     * 주차별 히트맵 생성
     */
    generateHeatmap(logs) {
        if (logs.length === 0) {
            return {
                weeks: [],
                days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                matrix: []
            };
        }
        
        // 날짜별 점수 맵 생성
        const dateScoreMap = {};
        logs.forEach(log => {
            const score = log.participants 
                ? log.participants.reduce((sum, p) => sum + (p.contributionScore || 0), 0)
                : 0;
            dateScoreMap[log.date] = (dateScoreMap[log.date] || 0) + score;
        });
        
        // 전체 기간의 시작/끝 날짜
        const dates = logs.map(log => new Date(log.date)).sort((a, b) => a - b);
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        // 시작 날짜를 월요일로 조정
        const firstMonday = new Date(startDate);
        firstMonday.setDate(firstMonday.getDate() - (firstMonday.getDay() + 6) % 7);
        
        // 끝 날짜를 일요일로 조정
        const lastSunday = new Date(endDate);
        lastSunday.setDate(lastSunday.getDate() + (7 - lastSunday.getDay()) % 7);
        
        // 주차 계산
        const weeks = [];
        const matrix = [];
        
        let currentDate = new Date(firstMonday);
        let weekIndex = 0;
        
        while (currentDate <= lastSunday) {
            const weekStart = new Date(currentDate);
            const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
            weeks.push(weekLabel);
            
            const weekData = [];
            for (let day = 0; day < 7; day++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const score = dateScoreMap[dateStr] || 0;
                weekData.push(score);
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            matrix.push(weekData);
            weekIndex++;
        }
        
        return {
            weeks,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            matrix
        };
    },
    
    /**
     * 승인 상황 분석
     */
    analyzeApprovals(members, logs) {
        const pending = [];
        const rejected = [];
        
        logs.forEach(log => {
            if (!log.participants) return;
            
            log.participants.forEach(p => {
                const member = members.find(m => m.id === p.memberId);
                if (!member) return;
                
                // approved가 false 또는 undefined인 경우 pending
                if (p.approved === false || p.approved === undefined) {
                    pending.push({
                        logId: log.id,
                        logTitle: log.title,
                        memberId: p.memberId,
                        alias: member.alias,
                        role: p.role
                    });
                }
                
                // 향후 확장: rejected 상태 처리
                // if (p.approved === 'rejected') {
                //     rejected.push({
                //         logId: log.id,
                //         logTitle: log.title,
                //         memberId: p.memberId,
                //         alias: member.alias,
                //         role: p.role,
                //         reason: p.rejectReason
                //     });
                // }
            });
        });
        
        return { pending, rejected };
    }
};

// 전역 노출
window.SummaryEngine = SummaryEngine;
