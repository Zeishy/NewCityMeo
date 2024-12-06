// Campaign.js

// Define content item structure
class ContentItem {
  constructor(type, source, duration) {
    this.type = type; // 'image' | 'video' | 'url'
    this.source = source; // path or URL
    this.duration = duration; // in seconds
  }
}

class Campaign {
  constructor(name, range = 1) {
    this.name = name;
    this.isActive = false;
    this.range = this.validateRange(range);
    this.contents = []; // Array of ContentItem
    this.totalDuration = 0;
  }

  validateRange(range) {
    const validRange = Math.max(1, Math.min(10, range)); // Range 1-10
    return validRange;
  }

  addContent(type, source, duration) {
    const validTypes = ['image', 'video', 'url'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid content type. Must be image, video, or url');
    }

    const content = new ContentItem(type, source, duration);
    this.contents.push(content);
    this.totalDuration += duration;
    return content;
  }

  removeContent(index) {
    if (index >= 0 && index < this.contents.length) {
      const removed = this.contents.splice(index, 1)[0];
      this.totalDuration -= removed.duration;
      return true;
    }
    return false;
  }

  toggleActive() {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  getContents() {
    return this.contents;
  }

  getDuration() {
    return this.totalDuration;
  }
}

export default Campaign;