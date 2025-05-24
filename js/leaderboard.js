/**
 * Leaderboard class for tracking player scores
 */
class Leaderboard {
    constructor() {
        this.players = [];
        this.maxEntries = 10;
        this.localStorageKey = 'fishEatFishLeaderboard';
        this.loadFromLocalStorage();
    }

    addPlayer(player) {
        // Add player to tracked players if not already present
        if (!this.players.includes(player)) {
            this.players.push(player);
        }
    }

    removePlayer(player) {
        // Remove player from tracked players
        const index = this.players.findIndex(p => p === player);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
    }

    update() {
        // Sort players by score in descending order
        this.players.sort((a, b) => b.score - a.score);
    }

    getTopPlayers(count = 10) {
        return this.players.slice(0, count);
    }

    getPlayerRank(player) {
        return this.players.findIndex(p => p === player) + 1;
    }

    saveHighScore(name, score, size) {
        // Load existing high scores
        const highScores = this.loadHighScores();

        // Add new score
        highScores.push({
            name,
            score,
            size,
            date: new Date().toISOString()
        });

        // Sort by score (descending)
        highScores.sort((a, b) => b.score - a.score);

        // Keep only top scores
        const topScores = highScores.slice(0, this.maxEntries);

        // Save to local storage
        localStorage.setItem(this.localStorageKey, JSON.stringify(topScores));

        return topScores;
    }

    loadHighScores() {
        const storedScores = localStorage.getItem(this.localStorageKey);
        return storedScores ? JSON.parse(storedScores) : [];
    }

    loadFromLocalStorage() {
        // This just loads the high scores, doesn't affect current game players
        this.highScores = this.loadHighScores();
    }

    isHighScore(score) {
        const highScores = this.loadHighScores();

        // If we have fewer than max entries, any score is a high score
        if (highScores.length < this.maxEntries) {
            return true;
        }

        // Otherwise, check if score is higher than the lowest high score
        return score > highScores[highScores.length - 1].score;
    }

    renderLeaderboard(ctx, x, y, width, height) {
        // Update player rankings
        this.update();

        // Draw leaderboard background
        ctx.save();
        ctx.fillStyle = 'rgba(0, 30, 60, 0.2)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Add subtle shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw title
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEADERBOARD', x + width / 2, y + 20);

        // Reset shadow for better text rendering
        ctx.shadowBlur = 0;

        // Draw headers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Rank', x + 10, y + 40);
        ctx.fillText('Name', x + 50, y + 40);
        ctx.textAlign = 'right';
        ctx.fillText('Score', x + width - 10, y + 40);

        // Draw separator line
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 45);
        ctx.lineTo(x + width - 5, y + 45);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw player entries
        const topPlayers = this.getTopPlayers(8);
        ctx.textAlign = 'left';

        for (let i = 0; i < topPlayers.length; i++) {
            const player = topPlayers[i];
            const entryY = y + 65 + (i * 20);

            // Highlight current player
            if (player.isCurrentPlayer) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
                ctx.fillRect(x + 5, entryY - 15, width - 10, 20);

                // Add subtle glow for current player
                ctx.shadowColor = 'rgba(255, 255, 0, 0.3)';
                ctx.shadowBlur = 5;
            } else {
                ctx.shadowBlur = 0;
            }

            // Draw rank
            ctx.fillStyle = player.isCurrentPlayer ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`${i + 1}.`, x + 10, entryY);

            // Draw name (truncate if too long)
            let displayName = player.name;
            if (displayName.length > 12) {
                displayName = displayName.substring(0, 10) + '...';
            }
            ctx.fillText(displayName, x + 50, entryY);

            // Draw score
            ctx.textAlign = 'right';
            ctx.fillText(player.score.toString(), x + width - 10, entryY);
            ctx.textAlign = 'left';

            // Reset shadow
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    renderGameOverLeaderboard(ctx, x, y, width, height, currentPlayer) {
        // Get high scores
        const highScores = this.loadHighScores();

        // Draw leaderboard background
        ctx.save();
        ctx.fillStyle = 'rgba(0, 30, 60, 0.4)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Add subtle shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw title
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HIGH SCORES', x + width / 2, y + 30);

        // Reset shadow for better text rendering
        ctx.shadowBlur = 0;

        // Draw headers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Rank', x + 20, y + 60);
        ctx.fillText('Name', x + 70, y + 60);
        ctx.textAlign = 'right';
        ctx.fillText('Score', x + width - 70, y + 60);
        ctx.fillText('Size', x + width - 20, y + 60);

        // Draw separator line
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 70);
        ctx.lineTo(x + width - 10, y + 70);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw high score entries
        ctx.textAlign = 'left';

        for (let i = 0; i < highScores.length; i++) {
            const score = highScores[i];
            const entryY = y + 95 + (i * 25);

            // Highlight current player's new high score
            if (currentPlayer && score.name === currentPlayer.name && score.score === currentPlayer.score) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(x + 10, entryY - 20, width - 20, 25);
                ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'; // Gold color with slight transparency

                // Add subtle glow for current player's score
                ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
                ctx.shadowBlur = 5;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 0;
            }

            // Draw rank
            ctx.fillText(`${i + 1}.`, x + 20, entryY);

            // Draw name (truncate if too long)
            let displayName = score.name;
            if (displayName.length > 12) {
                displayName = displayName.substring(0, 10) + '...';
            }
            ctx.fillText(displayName, x + 70, entryY);

            // Draw score
            ctx.textAlign = 'right';
            ctx.fillText(score.score.toString(), x + width - 70, entryY);

            // Draw size
            ctx.fillText(score.size.toString(), x + width - 20, entryY);

            ctx.textAlign = 'left';

            // Reset shadow
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}
