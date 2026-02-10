/**
 * 역할 추천 엔진
 * 
 * 팀원의 프로필을 기반으로 역할을 추천합니다.
 * 실제 역할을 변경하지 않고 제안만 제공합니다.
 */

// 역할 정의
const ROLES = {
    PL: { key: 'PL', name: '기획/총괄' },
    DEV: { key: 'DEV', name: '개발' },
    DESIGN: { key: 'DESIGN', name: '디자인' },
    PRESENT: { key: 'PRESENT', name: '발표' },
    DOCS: { key: 'DOCS', name: '문서' },
    DATA: { key: 'DATA', name: '데이터/분석' }
};

const RoleRecommendationEngine = {
    /**
     * 팀 전체 역할 추천
     * @param {Array} members - 팀원 목록
     * @returns {Object} 추천 결과
     */
    recommendRoles(members) {
        if (!members || members.length === 0) {
            return {
                recommendations: [],
                message: '팀원이 없습니다.'
            };
        }

        // 각 팀원별 역할 점수 계산
        const memberScores = members.map(member => ({
            memberId: member.id,
            alias: member.alias,
            scores: this.calculateRoleScores(member)
        }));

        // 팀 전체 최적 역할 조합 생성
        const recommendations = this.assignOptimalRoles(memberScores);

        return {
            recommendations,
            message: recommendations.length > 0 
                ? '추천 결과입니다. 참고용이며 최종 역할은 팀이 결정합니다.' 
                : '프로필 정보가 부족하여 추천할 수 없습니다.'
        };
    },

    /**
     * 개별 팀원의 역할별 점수 계산
     * @param {Object} member - 팀원 정보
     * @returns {Object} 역할별 점수
     */
    calculateRoleScores(member) {
        const scores = {};
        const profile = member.profile;

        // 프로필이 없으면 기본 점수만
        if (!profile) {
            Object.keys(ROLES).forEach(roleKey => {
                scores[roleKey] = 0;
            });
            return scores;
        }

        // 모든 역할에 대해 점수 계산
        Object.keys(ROLES).forEach(roleKey => {
            let score = 0;

            // [1] 학과(majorType) 가중치
            score += this.getMajorTypeScore(profile.majorType, roleKey);

            // [2] 보유 역량(skills)
            score += this.getSkillScore(profile.skills, roleKey);

            // [3] 선호 역할(preferredRoles)
            score += this.getPreferredRoleScore(profile.preferredRoles, roleKey);

            // [4] 비선호 역할(avoidRole)
            if (profile.avoidRole === roleKey) {
                score = -100; // 사실상 추천 제외
            }

            scores[roleKey] = score;
        });

        return scores;
    },

    /**
     * 학과 계열에 따른 점수
     */
    getMajorTypeScore(majorType, roleKey) {
        if (!majorType) return 0;

        const majorScores = {
            'ENGINEERING': {
                'DEV': 2,
                'DATA': 2
            },
            'DESIGN': {
                'DESIGN': 3
            },
            'ART': {
                'DESIGN': 3,
                'PRESENT': 3
            },
            'HUMANITIES': {
                'DESIGN': 3,
                'PRESENT': 3,
                'DOCS': 2
            }
        };

        return majorScores[majorType]?.[roleKey] || 0;
    },

    /**
     * 보유 역량에 따른 점수
     */
    getSkillScore(skills, roleKey) {
        if (!skills || !Array.isArray(skills)) return 0;

        // 역량과 역할 매칭
        const skillRoleMap = {
            'DEV': 'DEV',
            'DESIGN': 'DESIGN',
            'PRESENT': 'PRESENT',
            'DOCS': 'DOCS',
            'DATA': 'DATA'
        };

        // 해당 역할과 일치하는 역량이 있으면 +2
        return skills.includes(skillRoleMap[roleKey]) ? 2 : 0;
    },

    /**
     * 선호 역할에 따른 점수
     */
    getPreferredRoleScore(preferredRoles, roleKey) {
        if (!preferredRoles || !Array.isArray(preferredRoles)) return 0;

        const index = preferredRoles.indexOf(roleKey);
        if (index === -1) return 0;

        // 1순위: +3, 2순위: +2, 3순위: +1
        const scores = [3, 2, 1];
        return scores[index] || 0;
    },

    /**
     * 팀 전체 최적 역할 조합 생성
     */
    assignOptimalRoles(memberScores) {
        const recommendations = [];
        const assignedRoles = new Set();
        const assignedMembers = new Set();

        // 모든 역할 키
        const allRoles = Object.keys(ROLES);

        // 1차: 각 팀원의 최고 점수 역할 할당 (중복 방지)
        memberScores.forEach(member => {
            // 점수 순으로 정렬
            const sortedRoles = Object.entries(member.scores)
                .filter(([role, score]) => score > 0) // 양수 점수만
                .sort((a, b) => b[1] - a[1]); // 점수 높은 순

            // 아직 할당되지 않은 역할 중 최고 점수 선택
            for (const [roleKey, score] of sortedRoles) {
                if (!assignedRoles.has(roleKey)) {
                    recommendations.push({
                        memberId: member.memberId,
                        alias: member.alias,
                        suggestedRole: roleKey,
                        score: score,
                        reason: this.generateReason(member, roleKey, score)
                    });
                    assignedRoles.add(roleKey);
                    assignedMembers.add(member.memberId);
                    break;
                }
            }
        });

        // 2차: 역할이 할당되지 않은 팀원에게 남은 역할 할당
        memberScores.forEach(member => {
            if (assignedMembers.has(member.memberId)) return;

            const sortedRoles = Object.entries(member.scores)
                .filter(([role, score]) => score > -100) // 비선호 제외
                .sort((a, b) => b[1] - a[1]);

            if (sortedRoles.length > 0) {
                const [roleKey, score] = sortedRoles[0];
                recommendations.push({
                    memberId: member.memberId,
                    alias: member.alias,
                    suggestedRole: roleKey,
                    score: score,
                    reason: this.generateReason(member, roleKey, score)
                });
                assignedMembers.add(member.memberId);
            }
        });

        return recommendations;
    },

    /**
     * 추천 이유 생성
     */
    generateReason(member, roleKey, score) {
        const reasons = [];
        const profile = member.profile;

        if (!profile) {
            return '프로필 정보 없음';
        }

        // 학과 계열
        const majorScore = this.getMajorTypeScore(profile.majorType, roleKey);
        if (majorScore > 0) {
            const majorNames = {
                'ENGINEERING': '공학 계열',
                'DESIGN': '디자인 계열',
                'ART': '예술 계열',
                'HUMANITIES': '인문 계열'
            };
            reasons.push(majorNames[profile.majorType]);
        }

        // 보유 역량
        const skillScore = this.getSkillScore(profile.skills, roleKey);
        if (skillScore > 0) {
            reasons.push('보유 역량 일치');
        }

        // 선호 역할
        if (profile.preferredRoles && profile.preferredRoles.includes(roleKey)) {
            const index = profile.preferredRoles.indexOf(roleKey);
            reasons.push(`선호 ${index + 1}순위`);
        }

        // 점수 표시
        reasons.push(`점수: ${score}`);

        return reasons.length > 0 ? reasons.join(' + ') : '기본 추천';
    },

    /**
     * 역할 이름 가져오기
     */
    getRoleName(roleKey) {
        return ROLES[roleKey]?.name || roleKey;
    }
};

// 전역 노출
window.RoleRecommendationEngine = RoleRecommendationEngine;
window.ROLES = ROLES;
