"""Regenerate VTT/ASS and the captioned video from the editable SRT."""

import argparse
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent


def milliseconds(timestamp):
    hours, minutes, seconds, fraction = map(int, re.split(r'[:,]', timestamp))
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + fraction


def ass_time(value):
    centiseconds = (value + 5) // 10
    seconds, fraction = divmod(centiseconds, 100)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f'{hours}:{minutes:02}:{seconds:02}.{fraction:02}'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--part', type=int, choices=(1, 2, 3), default=1)
    part = parser.parse_args().part
    suffix = '' if part == 1 else f'-part{part}'
    srt_path = HERE / f'subtitles{suffix}.zh-TW.srt'
    video_path = HERE / f'chictrip-pitch-20261013{suffix}.zh-TW.mp4'
    source_video = 'source.mov' if part == 1 else f'source-part{part}.mp4'
    width, height, font_size, margin_h, margin_v = {
        1: (2704, 1756, 60, 120, 14),
        2: (1920, 1152, 44, 85, 10),
        3: (1146, 720, 26, 50, 4),
    }[part]
    # ReplayKit recordings can have a final video frame extending past the
    # movie's declared duration. Explicitly cap the export at that duration.
    duration = subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', source_video,
    ], cwd=HERE, text=True).strip()
    duration_ms = round(float(duration) * 1000)
    source = srt_path.read_text(encoding='utf-8-sig').strip()
    cues = []
    previous_end = 0
    for block in re.split(r'\n\s*\n', source):
        lines = block.splitlines()
        match = re.fullmatch(
            r'(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})',
            lines[1],
        )
        if not match:
            raise ValueError(f'Invalid SRT cue: {lines[0]}')
        start, end = map(milliseconds, match.groups())
        caption = '\n'.join(lines[2:])
        if not caption or start < previous_end or end <= start or end > duration_ms:
            raise ValueError(f'Invalid caption or timing: {lines[0]}')
        cues.append((start, end, caption))
        previous_end = end

    vtt = re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})', r'\1.\2', source)
    (HERE / f'subtitles{suffix}.zh-TW.vtt').write_text('WEBVTT\n\n' + vtt + '\n', encoding='utf-8')
    ass = f'''[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Heiti TC,{font_size},&H00FFFFFF,&H00FFFFFF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,{margin_h},{margin_h},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    for start, end, caption in cues:
        escaped = caption.replace('\\', r'\\').replace('{', r'\{').replace('}', r'\}')
        escaped = escaped.replace('\n', r'\N')
        ass += f'Dialogue: 0,{ass_time(start)},{ass_time(end)},Default,,0,0,0,,{escaped}\n'
    ass_name = f'subtitles{suffix}.zh-TW.ass'
    (HERE / ass_name).write_text(ass, encoding='utf-8')
    video_filter = 'fps=30,'
    if part == 2:
        video_filter += 'pad=iw:ih+72:0:0:color=0x0c0f12,'
    video_filter += f'ass={ass_name}'
    subprocess.run([
        'ffmpeg', '-hide_banner', '-y', '-i', source_video,
        '-t', duration,
        '-map', '0:v:0', '-map', '0:a:0',
        '-vf', video_filter,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-c:a', 'copy', '-movflags', '+faststart', video_path.name,
    ], cwd=HERE, check=True)
    print(f'Rendered part {part}, {len(cues)} captions: {video_path}')


if __name__ == '__main__':
    main()
